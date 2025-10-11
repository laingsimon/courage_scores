using System.Collections;
using System.Net;
using Microsoft.Azure.Cosmos;
using Moq;
using Newtonsoft.Json;

namespace CourageScores.StubCosmos.Api;

public class StubFeedIterator<T>(params T[] items) : FeedIterator<T>
{
    private readonly List<T> _items = items.ToList();

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

        private class NotifyingEnumerator(IEnumerator<T> enumerator, Action beforeRecord, Action atEnd)
            : IEnumerator<T>
        {
            public bool MoveNext()
            {
                var canMoveNext = enumerator.MoveNext();
                if (canMoveNext)
                {
                    beforeRecord();
                }
                else
                {
                    atEnd();
                }
                return canMoveNext;
            }

            public void Reset()
            {
                enumerator.Reset();
            }

            public T Current => enumerator.Current;
            object IEnumerator.Current => Current!;

            public void Dispose()
            {
                enumerator.Dispose();
            }
        }
    }

    public FeedIterator NotGeneric()
    {
        return new StubFeedIterator(_items.Cast<object>().ToList());
    }
}

file class StubFeedIterator(List<object> items) : FeedIterator
{
    public override Task<ResponseMessage> ReadNextAsync(CancellationToken cancellationToken = default)
    {
        var itemToReturn = items[0];
        items.RemoveRange(0, 1);

        var serialised = JsonConvert.SerializeObject(itemToReturn);
        var stream = new MemoryStream();
        using (var streamWriter = new StreamWriter(stream, leaveOpen: true))
        {
            streamWriter.Write(serialised);
        }
        stream.Seek(0, SeekOrigin.Begin);

        return Task.FromResult(new ResponseMessage
        {
            Content = stream
        });
    }

    public override bool HasMoreResults => items.Count > 0;
}
