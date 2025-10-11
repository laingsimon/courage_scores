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
                Value = Value ?? QueryParserException.StateError<Token>("No value provided for filter"),
            };
        }

        private CosmosColumnReference GetColumnName(string columnName)
        {
            var match = Regex.Match(columnName, @"^((?<alias>.+?)\.)?(?<name>.+)$");
            if (!match.Success)
            {
                return QueryParserException.SyntaxError<CosmosColumnReference>($"Unable to extract column name (and optional alias) from {columnName}");
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
                    return QueryParserException.SyntaxError<IQueryFilterOperator>($"Unknown operator {@operator}");
            }
        }

        public void Accept(Token token)
        {
            if (token.Type == TokenType.Operator)
            {
                if (Operator != null)
                {
                    if (Operator == "is" && token.Content == "not")
                    {
                        NotOperator = true;
                        return;
                    }

                    QueryParserException.StateError<object>("An operator has already been recorded for this filter");
                    return;
                }

                Operator = token.Content;
                return;
            }

            if (Operator == null)
            {
                QueryParserException.StateError<object>($"An operator has already been recorded for this filter\nTried to record {token.Content} ({token.Type})");
                return;
            }

            if (Value != null)
            {
                QueryParserException.StateError<object>($"A value has already been recorded for this filter\nTried to record {token.Content} ({token.Type})");
                return;
            }

            Value = token;
        }
    }

    private class ReaderState<T>
    {
        private Phase? _phase;
        private FilterState<T>? _filterState;
        private LogicalCosmosQueryFilter<T>? _currentFilter;
        private string? _lastLogicalOperator;
        private readonly List<ColumnExpression> _columns = new();
        private CosmosTable? _from;
        // private List<object> _groupBy = new();
        // private List<object> _orderBy = new();

        public void Accept(Token token)
        {
            if (token.Type == TokenType.Comment)
            {
                return;
            }

            if (_filterState != null && _filterState.Value == null)
            {
                _filterState.Accept(token);
                return;
            }

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
                    QueryParserException.NotSupported<object>("Cannot return text in a select");
                    return;
                case Phase.From:
                    QueryParserException.NotSupported<object>("Cannot select from text");
                    return;
                case Phase.GroupBy:
                    QueryParserException.NotSupported<object>("Cannot group by text");
                    return;
                case Phase.OrderBy:
                    QueryParserException.NotSupported<object>("Cannot order by text");
                    return;
                case Phase.Where:
                    if (_filterState == null)
                    {
                        QueryParserException.StateError<object>("No current filter");
                        return;
                    }

                    _filterState.Value = token;
                    break;
                default:
                    QueryParserException.StateError<object>($"Unexpected phase {_phase}");
                    return;
            }
        }

        private void AcceptOperator(Token token)
        {
            switch (_phase)
            {
                case Phase.Where:
                    if (_filterState == null)
                    {
                        QueryParserException.StateError<object>("No column name specified for the filter");
                        return;
                    }

                    if (_filterState.Operator == "is" && token.Content == "not")
                    {
                        _filterState.NotOperator = true;
                        break;
                    }

                    _filterState!.Operator = token.Content;
                    break;
                default:
                    QueryParserException.StateError<object>($"Operators are not supported in a {_phase}");
                    return;
            }
        }

        private void AcceptBlock()
        {
            switch (_phase)
            {
                case Phase.OrderBy:
                case Phase.From:
                case Phase.GroupBy:
                    QueryParserException.NotSupported<object>($"Blocks are not supported in a {_phase}");
                    return;
                default:
                    QueryParserException.NotSupported<object>($"Blocks are not supported in a {_phase}");
                    return;
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
                    return;
                case Phase.From:
                    if (_from == null)
                    {
                        _from = new CosmosTable
                        {
                            Name = token.Content,
                        };
                    }
                    else if (_from.Alias == null)
                    {
                        _from.Alias = token.Content;
                    }
                    else
                    {
                        QueryParserException.StateError<object>($"From token is invalid, name and alias have already been processed, near {token.Content}");
                    }

                    return;
                case Phase.Where:
                    if (token.Content == "and" || token.Content == "or")
                    {
                        HandleCurrentFilter(token.Content);
                        return;
                    }

                    if (_filterState != null)
                    {
                        QueryParserException.StateError<object>($"Previous filter not closed off when handling {token.Content} ({token.Type})");
                        return;
                    }

                    _filterState = new FilterState<T>
                    {
                        ColumnName = token.Content,
                    };
                    return;
                default:
                    QueryParserException.NotSupported<object>($"Query token not supported in a {_phase}");
                    return;
            }
        }

        private void HandleCurrentFilter(string logicalOperator)
        {
            if (_filterState == null)
            {
                QueryParserException.StateError<object>($"Cannot {logicalOperator} a statement that doesn't exist");
                return;
            }

            var thisFilter = _filterState!.BuildFilter();

            _currentFilter ??= new LogicalCosmosQueryFilter<T>();

            if (logicalOperator == "and")
            {
                _currentFilter = new LogicalCosmosQueryFilter<T>
                {
                    And = _currentFilter.And.Concat([thisFilter]).ToArray(),
                    Or = _currentFilter.Or,
                };
            }
            else if (logicalOperator == "or")
            {
                _currentFilter = new LogicalCosmosQueryFilter<T>
                {
                    And = _currentFilter.And,
                    Or = _currentFilter.Or.Concat([thisFilter]).ToArray(),
                };
            }
            else
            {
                QueryParserException.NotSupported<object>($"Unsure how to handle '{logicalOperator}'");
                return;
            }

            _filterState = null;
            _lastLogicalOperator = logicalOperator;
        }

        public CosmosQuery<T> BuildQuery()
        {
            if (_filterState != null)
            {
                HandleCurrentFilter(_lastLogicalOperator ?? "and");
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
