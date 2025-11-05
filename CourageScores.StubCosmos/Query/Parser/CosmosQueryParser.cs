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

        public object? Accept(Token token)
        {
            if (token.Type == TokenType.Operator)
            {
                if (Operator != null)
                {
                    if (Operator == "is" && token.Content == "not")
                    {
                        NotOperator = true;
                        return null;
                    }

                    return QueryParserException.StateError<object>("An operator has already been recorded for this filter");
                }

                Operator = token.Content;
                return null;
            }

            if (Operator == null)
            {
                return QueryParserException.StateError<object>($"An operator has not been recorded for this filter\nTried to record `{token.Content}` ({token.Type})");
            }

            if (Value != null)
            {
                return QueryParserException.StateError<object>($"A value has already been recorded for this filter\nTried to record {token.Content} ({token.Type})");
            }

            Value = token;
            return null;
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

        // ReSharper disable once UnusedMethodReturnValue.Local
        public object? Accept(Token token)
        {
            if (token.Type == TokenType.Comment)
            {
                return null;
            }

            if (_filterState != null && _filterState.Value == null)
            {
                return _filterState.Accept(token);
            }

            switch (token.Type)
            {
                case TokenType.Query:
                    return AcceptQuery(token);
                case TokenType.Number:
                    return AcceptQueryToken(token);
                case TokenType.Block:
                    return AcceptBlock();
                case TokenType.Comment:
                    return null;
                case TokenType.Operator:
                    return AcceptOperator(token);
                case TokenType.Text:
                    return AcceptText(token);
                case TokenType.Array:
                    return AcceptArray(token);
                default:
                    return QueryParserException.NotSupported<object?>($"Token type {token.Type} is not supported");
            }
        }

        private object? AcceptArray(Token token)
        {
            switch (_phase)
            {
                case Phase.Where:
                    if (_filterState == null)
                    {
                        return QueryParserException.StateError<object>("No current filter");
                    }

                    _filterState.Value = token;
                    break;
                default:
                    return QueryParserException.NotSupported<object>($"Arrays are not supported in a {_phase}");
            }

            return null;
        }

        private object? AcceptText(Token token)
        {
            switch (_phase)
            {
                case Phase.Select:
                    return QueryParserException.NotSupported<object>("Cannot return text in a select");
                case Phase.From:
                    return QueryParserException.NotSupported<object>("Cannot select from text");
                case Phase.Where:
                    if (_filterState == null)
                    {
                        return QueryParserException.StateError<object>("No current filter");
                    }

                    _filterState.Value = token;
                    break;
                default:
                    return QueryParserException.StateError<object>($"Unexpected phase {_phase}");
            }

            return null;
        }

        private object? AcceptOperator(Token token)
        {
            switch (_phase)
            {
                case Phase.Where:
                    if (_filterState == null)
                    {
                        return QueryParserException.StateError<object>("No column name specified for the filter");
                    }

                    if (_filterState.Operator == "is" && token.Content == "not")
                    {
                        _filterState.NotOperator = true;
                        break;
                    }

                    _filterState!.Operator = token.Content;
                    break;
                default:
                    return QueryParserException.StateError<object>($"Operators are not supported in a {_phase}");
            }

            return null;
        }

        private object AcceptBlock()
        {
            switch (_phase)
            {
                case Phase.From:
                    return QueryParserException.NotSupported<object>($"Blocks are not supported in a {_phase}");
                default:
                    return QueryParserException.NotSupported<object>($"Blocks are not supported in a {_phase}");
            }
        }

        private object? AcceptQuery(Token token)
        {
            switch (token.Content)
            {
                case "select":
                    _phase = Phase.Select;
                    break;
                case "from":
                    if (_phase != Phase.Select)
                    {
                        return QueryParserException.SyntaxError<object>("from is only valid after a select");
                    }

                    _phase = Phase.From;
                    break;
                case "where":
                    if (_from == null)
                    {
                        return QueryParserException.SyntaxError<object>("No table present in query");
                    }

                    _phase = Phase.Where;
                    break;
                default:
                    AcceptQueryToken(token);
                    break;
            }

            return null;
        }

        private object? AcceptQueryToken(Token token)
        {
            switch (_phase)
            {
                case Phase.Select:
                    _columns.Add(new ColumnExpression { Expression = token.Content });
                    return null;
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
                        return QueryParserException.StateError<object>($"From token is invalid, name and alias have already been processed, near {token.Content}");
                    }

                    return null;
                case Phase.Where:
                    if (token.Content == "and" || token.Content == "or")
                    {
                        HandleCurrentFilter(token.Content);
                        return null;
                    }

                    if (_filterState != null)
                    {
                        return QueryParserException.StateError<object>($"Previous filter not closed off when handling {token.Content} ({token.Type})");
                    }

                    _filterState = new FilterState<T>
                    {
                        ColumnName = token.Content,
                    };
                    return null;
                default:
                    return QueryParserException.NotSupported<object>($"Query token not supported in a {_phase}");
            }
        }

        // ReSharper disable once UnusedMethodReturnValue.Local
        private object? HandleCurrentFilter(string logicalOperator)
        {
            if (_filterState == null)
            {
                return QueryParserException.StateError<object>($"Cannot {logicalOperator} a statement that doesn't exist");
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
                return QueryParserException.NotSupported<object>($"Unsure how to handle '{logicalOperator}'");
            }

            _filterState = null;
            _lastLogicalOperator = logicalOperator;
            return null;
        }

        public CosmosQuery<T> BuildQuery()
        {
            if (_filterState != null)
            {
                HandleCurrentFilter(_lastLogicalOperator ?? "and");
            }

            if (_from == null)
            {
                return QueryParserException.SyntaxError<CosmosQuery<T>>("No table present in query");
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
