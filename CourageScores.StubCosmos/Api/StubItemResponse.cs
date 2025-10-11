using System.Diagnostics.CodeAnalysis;
using System.Net;
using Microsoft.Azure.Cosmos;
using Moq;

namespace CourageScores.StubCosmos.Api;

[ExcludeFromCodeCoverage]
public class StubItemResponse<T> : ItemResponse<T>
{
    public StubItemResponse(
        Headers? headers = null,
        T resource = default!,
        HttpStatusCode statusCode = default,
        CosmosDiagnostics? diagnostics = null,
        double requestCharge = default,
        string? activityId = null,
        string? eTag = null)
    {
        Headers = headers ?? new Headers();
        Resource = resource;
        StatusCode = statusCode;
        Diagnostics = diagnostics ?? new Mock<CosmosDiagnostics>().Object;
        RequestCharge = requestCharge;
        ActivityId = activityId ?? "";
        ETag = eTag ?? "";
    }

    public override Headers Headers { get; }
    public override T Resource { get; }
    public override HttpStatusCode StatusCode { get; }
    public override CosmosDiagnostics Diagnostics { get; }
    public override double RequestCharge { get; }
    public override string ActivityId { get; }
    public override string ETag { get; }
}
