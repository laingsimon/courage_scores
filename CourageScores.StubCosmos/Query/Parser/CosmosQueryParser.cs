using System.Text.RegularExpressions;
using CourageScores.StubCosmos.Query.Tokeniser;

namespace CourageScores.StubCosmos.Query.Parser;

internal class CosmosQueryParser
{
    private readonly QueryTokeniser _tokeniser = new();

    public CosmosQuery<T> Parse<T>(string query)
    {
        var state = new ReaderState<T>();
        foreach (var token in _tokeniser.Tokenise(query))
        {
            state.Accept(token);
        }

        return state.BuildQuery();
    }

    private enum Phase
    {
        Select,
        From,
        Where,
        GroupBy,
        OrderBy
    }

    private class FilterState<T>
    {
        public string? ColumnName { get; init; }
        public string? Operator { get; set; }
        public Token? Value { get; set; }
        public bool NotOperator { get; set; }

        public CosmosQueryFilter<T> BuildFilter()
        {
            return new CosmosQueryFilter<T>
            {
                ColumnName = GetColumnName(ColumnName!),
                Operator = NotOperator
                    ? new NotCosmosQueryOperator(GetOperator(Operator!))
                    : GetOperator(Operator!),
                Value = Value!
            };
        }

        private CosmosColumnReference GetColumnName(string columnName)
        {
            var match = Regex.Match(columnName, @"^((?<alias>.+?)\.)?(?<name>.+)$");
            if (!match.Success)
            {
                throw new ArgumentException($"Invalid column name: {columnName}");
            }

            return new CosmosColumnReference
            {
                ColumnName = match.Groups["name"].Value,
                TableAlias = match.Groups["alias"].Value,
            };
        }

        private IQueryFilterOperator GetOperator(string @operator)
        {
            switch (@operator)
            {
                case "=": return CosmosQueryOperator.EqualTo;
                case "is": return CosmosQueryOperator.EqualTo;
                case "in": return CosmosQueryOperator.In;
                case "<>":
                case "!=": return new NotCosmosQueryOperator(CosmosQueryOperator.EqualTo);
                case ">": return CosmosQueryOperator.GreaterThan;
                case ">=": return CosmosQueryOperator.GreaterThanOrEqualTo;
                case "<": return CosmosQueryOperator.LessThan;
                case "<=": return CosmosQueryOperator.LessThanOrEqualTo;
                default:
                    throw new ArgumentOutOfRangeException(nameof(@operator), @operator, null);
            }
        }
    }

    private class ReaderState<T>
    {
        private Phase? _phase;
        private FilterState<T>? _filterState;
        private LogicalCosmosQueryFilter<T>? _currentFilter;
        private readonly List<ColumnExpression> _columns = new();
        private CosmosTable? _from;
        // private List<object> _groupBy = new();
        // private List<object> _orderBy = new();

        public void Accept(Token token)
        {
            switch (token.Type)
            {
                case TokenType.Query:
                    AcceptQuery(token);
                    break;
                case TokenType.Block:
                    AcceptBlock();
                    break;
                case TokenType.Comment:
                    break;
                case TokenType.Operand:
                    AcceptOperand(token);
                    break;
                case TokenType.Operator:
                    AcceptOperator(token);
                    break;
                case TokenType.Text:
                    AcceptText(token);
                    break;
            }
        }

        private void AcceptText(Token token)
        {
            switch (_phase)
            {
                case Phase.Select:
                    throw new InvalidOperationException("Cannot return text in a select");
                case Phase.From:
                    throw new InvalidOperationException("Cannot select from text");
                case Phase.GroupBy:
                    throw new InvalidOperationException("Cannot group by text");
                case Phase.OrderBy:
                    throw new InvalidOperationException("Cannot order by text");
                case Phase.Where:
                    if (_filterState == null)
                    {
                        throw new InvalidOperationException("No filter context");
                    }

                    _filterState.Value = token;
                    break;
                default:
                    throw new InvalidOperationException($"Unsupported phase: {_phase}");
            }
        }

        private void AcceptOperator(Token token)
        {
            switch (_phase)
            {
                case Phase.Where:
                    if (_filterState == null)
                    {
                        throw new InvalidOperationException("No column name specified for the filter");
                    }

                    if (_filterState.Operator == "is" && token.Content == "not")
                    {
                        _filterState.NotOperator = true;
                        break;
                    }

                    _filterState!.Operator = token.Content;
                    break;
                default:
                    throw new InvalidOperationException($"Operators are not supported in a {_phase}");
            }
        }

        private void AcceptOperand(Token token)
        {
            switch (_phase)
            {
                case Phase.Where:
                    if (_filterState == null)
                    {
                        throw new InvalidOperationException("No column name specified for the filter");
                    }

                    _filterState.Value = token;
                    break;
                default:
                    throw new InvalidOperationException($"Operands are not supported in a {_phase}");
            }
        }

        private void AcceptBlock()
        {
            switch (_phase)
            {
                case Phase.OrderBy:
                case Phase.From:
                case Phase.GroupBy:
                    throw new InvalidOperationException($"Blocks aren't supported in a {_phase}");
                default:
                    throw new NotImplementedException();
            }
        }

        private void AcceptQuery(Token token)
        {
            switch (token.Content)
            {
                case "select":
                    _phase = Phase.Select;
                    break;
                case "from":
                    _phase = Phase.From;
                    break;
                case "where":
                    _phase = Phase.Where;
                    break;
                case "group by":
                    _phase = Phase.GroupBy;
                    break;
                case "order by":
                    _phase = Phase.OrderBy;
                    break;
                default:
                    AcceptQueryToken(token);
                    break;
            }
        }

        private void AcceptQueryToken(Token token)
        {
            switch (_phase)
            {
                case Phase.Select:
                    _columns.Add(new ColumnExpression { Expression = token.Content });
                    break;
                case Phase.From:
                    if (_from == null)
                    {
                        _from = new CosmosTable {Name = token.Content};
                    }
                    else if (_from.Alias == null)
                    {
                        _from.Alias = token.Content;
                    }
                    else
                    {
                        throw new InvalidOperationException("Unexpected from token");
                    }

                    break;
                case Phase.Where:
                    if (token.Content == "and" || token.Content == "or")
                    {
                        HandleCurrentFilter(token.Content);
                    }

                    if (_filterState != null)
                    {
                        throw new InvalidOperationException($"Previous filter not closed off when handling {token.Content} ({token.Type})");
                    }

                    _filterState = new FilterState<T>
                    {
                        ColumnName = token.Content,
                    };
                    break;
                default:
                    throw new NotImplementedException();
            }
        }

        private void HandleCurrentFilter(string logicalStatement)
        {
            if (_filterState == null)
            {
                throw new InvalidOperationException($"Cannot {logicalStatement} a statement that doesn't exist");
            }

            var thisFilter = _filterState!.BuildFilter();

            if (_currentFilter == null)
            {
                _currentFilter = new LogicalCosmosQueryFilter<T>
                {
                    And = [thisFilter],
                };
            }
            else if (logicalStatement == "and")
            {
                _currentFilter = new LogicalCosmosQueryFilter<T>
                {
                    And = _currentFilter.And.Concat([thisFilter]).ToArray(),
                    Or = _currentFilter.Or,
                };
            }
            else if (logicalStatement == "or")
            {
                _currentFilter = new LogicalCosmosQueryFilter<T>
                {
                    And = _currentFilter.And,
                    Or = _currentFilter.Or.Concat([thisFilter]).ToArray(),
                };
            }
            else
            {
                throw new NotImplementedException();
            }

            _filterState = null;
        }

        public CosmosQuery<T> BuildQuery()
        {
            if (_filterState != null)
            {
                HandleCurrentFilter("and");
            }

            return new CosmosQuery<T>
            {
                SelectColumns = _columns.ToArray(),
                From = _from!,
                Where = _currentFilter != null ? [_currentFilter] : null,
            };
        }
    }
}
