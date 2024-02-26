using CourageScores.Models.Dtos.Live;
using CourageScores.Models.Live;

namespace CourageScores.Models.Adapters.Live;

public class WatchableDataDtoAdapter : ISimpleOnewayAdapter<WatchableData, WatchableDataDto>
{
    public Task<WatchableDataDto> Adapt(WatchableData model, CancellationToken token)
    {
        var originatingUrlBase = string.IsNullOrEmpty(model.Connection.OriginatingUrl)
            ? null
            : GetBaseFromUrl( model.Connection.OriginatingUrl);
        var relativeUrl = GetRelativeUrl(model.Publication.Id, model.Publication.DataType);

        return Task.FromResult(new WatchableDataDto
        {
            LastUpdate = model.Publication.LastUpdate,
            DataType = model.Publication.DataType,
            Id = model.Publication.Id,
            UserName = model.Connection.UserName,
            RelativeUrl = relativeUrl,
            AbsoluteUrl = !string.IsNullOrEmpty(originatingUrlBase)
                ? $"{originatingUrlBase}{relativeUrl}"
                : null,
            PublicationMode = model.PublicationMode,
        });
    }

    private static string GetRelativeUrl(Guid id, LiveDataType dataType)
    {
        switch (dataType)
        {
            case LiveDataType.Sayg:
                return $"/live/match/{id}";
            case LiveDataType.Tournament:
                return $"/tournament/{id}";
            default:
                return "/";
        }
    }

    private static string? GetBaseFromUrl(string originatingUrl)
    {
        if (!Uri.TryCreate(originatingUrl, UriKind.Absolute, out var url))
        {
            return null;
        }

        var portSuffix = url.Port == 80
            ? ""
            : $":{url.Port}";
        return $"{url.Scheme}://{url.Host}{portSuffix}";
    }
}