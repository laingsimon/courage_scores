using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Models.Dtos.Live;
using CourageScores.Models.Live;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Live;

public class WatchableDataDtoAdapter : ISimpleOnewayAdapter<WatchableData, WatchableDataDto>
{
    private readonly IGenericDataService<TournamentGame, TournamentGameDto> _tournamentService;
    private readonly IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> _saygStorageService;

    public WatchableDataDtoAdapter(
        IGenericDataService<TournamentGame, TournamentGameDto> tournamentService,
        IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> saygStorageService)
    {
        _tournamentService = tournamentService;
        _saygStorageService = saygStorageService;
    }

    public async Task<WatchableDataDto> Adapt(WatchableData model, CancellationToken token)
    {
        var originatingUrlBase = string.IsNullOrEmpty(model.Connection.OriginatingUrl)
            ? null
            : GetBaseFromUrl( model.Connection.OriginatingUrl);
        var relativeUrl = GetRelativeUrl(model.Publication.Id, model.Publication.DataType);

        return new WatchableDataDto
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
            EventDetails = await GetEventDetails(model.Publication, model.Connection, token),
        };
    }

    private async Task<EventDetailsDto?> GetEventDetails(WebSocketPublication publication, WebSocketDetail connection, CancellationToken token)
    {
        switch (publication.DataType)
        {
            case LiveDataType.Sayg:
                var sayg = await _saygStorageService.Get(publication.Id, token);

                if (sayg == null)
                {
                    return null;
                }

                var saygTournament = await GetTournamentFromOriginatingUrl(connection.OriginatingUrl, token);

                return new EventDetailsDto
                {
                    Venue = saygTournament?.Address,
                    Opponents = new[] { sayg.YourName, sayg.OpponentName }.ToList(),
                    Type = saygTournament?.Type,
                };
            case LiveDataType.Tournament:
                var tournament = await _tournamentService.Get(publication.Id, token);

                if (tournament == null)
                {
                    return null;
                }

                return new EventDetailsDto
                {
                    Venue = tournament.Address,
                    Type = tournament.Type,
                };
            default:
                return new EventDetailsDto();
        }
    }

    private async Task<TournamentGameDto?> GetTournamentFromOriginatingUrl(string? originatingUrl, CancellationToken token)
    {
        if (string.IsNullOrEmpty(originatingUrl))
        {
            return null;
        }

        if (!Uri.TryCreate(originatingUrl, UriKind.Absolute, out var uri))
        {
            return null;
        }

        var uriFragment = uri.LocalPath.TrimEnd('/');
        var tournamentIdFragment = uriFragment.Length >= 36
            ? uriFragment.Substring(uriFragment.Length - 36)
            : "";
        if (Guid.TryParse(tournamentIdFragment, out var tournamentId))
        {
            return await _tournamentService.Get(tournamentId, token);
        }

        return null;
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