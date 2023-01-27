using System.Collections;
using System.Net;
using Microsoft.Azure.Cosmos;
using Moq;

namespace CourageScores.Tests.Services.Data;

public class MockFeedIterator<T> : FeedIterator<T>
{
    private readonly List<T> _items;

    public MockFeedIterator(params T[] items)
    {
        _items = items.ToList();
    }

    // ReSharper disable once MemberCanBePrivate.Local
    // ReSharper disable once AutoPropertyCanBeMadeGetOnly.Local
    public int BatchSize { get; set; } = 2;

    public override Task<FeedResponse<T>> ReadNextAsync(CancellationToken cancellationToken = default)
    {
        var nextBatch = _items.Take(BatchSize).ToArray();
        _items.RemoveRange(0, nextBatch.Length);

        return Task.FromResult<FeedResponse<T>>(new TypedFeedResponse(nextBatch)
        {
            BeforeRecord = BeforeRecord,
            AtEndOfBatch = AtEndOfBatch,
        });
    }

    public override bool HasMoreResults => _items.Count > 0;
    public Action? AtEndOfBatch { get; set; }
    public Action? BeforeRecord { get; set; }

    private class TypedFeedResponse : FeedResponse<T>
    {
        public TypedFeedResponse(
            IEnumerable<T> resource,
            Headers? headers = null,
            HttpStatusCode statusCode = default,
            CosmosDiagnostics? diagnostics = null,
            string? continuationToken = null,
            int count = default,
            string? indexMetrics = null)
        {
            Headers = headers ?? new Headers();
            Resource = resource;
            StatusCode = statusCode;
            Diagnostics = diagnostics ?? new Mock<CosmosDiagnostics>().Object;
            ContinuationToken = continuationToken ?? "";
            Count = count;
            IndexMetrics = indexMetrics ?? "";
        }

        public override Headers Headers { get; }
        public override IEnumerable<T> Resource { get; }
        public override HttpStatusCode StatusCode { get; }
        public override CosmosDiagnostics Diagnostics { get; }
        public override string ContinuationToken { get; }
        public override int Count { get; }
        public override string IndexMetrics { get; }
        public Action? BeforeRecord { get; set; }
        public Action? AtEndOfBatch { get; set; }

        public override IEnumerator<T> GetEnumerator()
        {
            return new NotifyingEnumerator(
                Resource.GetEnumerator(),
                BeforeRecord ?? (() => { }),
                AtEndOfBatch ?? (() => { }));
        }

        private class NotifyingEnumerator : IEnumerator<T>
        {
            private readonly IEnumerator<T> _enumerator;
            private readonly Action _beforeRecord;
            private readonly Action _atEnd;

            public NotifyingEnumerator(IEnumerator<T> enumerator, Action beforeRecord, Action atEnd)
            {
                _enumerator = enumerator;
                _beforeRecord = beforeRecord;
                _atEnd = atEnd;
            }

            public bool MoveNext()
            {
                var canMoveNext = _enumerator.MoveNext();
                if (canMoveNext)
                {
                    _beforeRecord();
                }
                else
                {
                    _atEnd();
                }
                return canMoveNext;
            }

            public void Reset()
            {
                _enumerator.Reset();
            }

            public T Current => _enumerator.Current;
            object IEnumerator.Current => Current;

            public void Dispose()
            {
                _enumerator.Dispose();
            }
        }
    }
}