using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Division;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Division;

public class DivisionDataContextBuilder
{
    private readonly List<CosmosGame> _games = new List<CosmosGame>();
    private readonly List<TeamDto> _teams = new List<TeamDto>();
    private readonly List<TournamentGame> _tournamentGames = new List<TournamentGame>();
    private readonly List<FixtureDateNoteDto> _notes = new List<FixtureDateNoteDto>();
    private readonly Dictionary<Guid, Guid?> _teamIdToDivisionIdLookup = new Dictionary<Guid, Guid?>();
    private readonly Dictionary<Guid, DivisionDto> _divisionLookup = new Dictionary<Guid, DivisionDto>();
    private readonly DivisionDataFilter _filter = new DivisionDataFilter();
    private SeasonDto _season = new SeasonDto();

    public DivisionDataContextBuilder WithGame(params CosmosGame[] games)
    {
        _games.AddRange(games);
        return this;
    }

    public DivisionDataContextBuilder WithTeam(params TeamDto[] teams)
    {
        _teams.AddRange(teams);
        return this;
    }

    public DivisionDataContextBuilder WithTournamentGame(params TournamentGame[] tournamentGames)
    {
        _tournamentGames.AddRange(tournamentGames);
        return this;
    }

    public DivisionDataContextBuilder WithNote(params FixtureDateNoteDto[] notes)
    {
        _notes.AddRange(notes);
        return this;
    }

    public DivisionDataContextBuilder WithSeason(SeasonDto season)
    {
        _season = season;
        return this;
    }

    public DivisionDataContextBuilder WithTeamIdToDivisionId(Guid teamId, Guid? divisionId)
    {
        _teamIdToDivisionIdLookup.Add(teamId, divisionId);
        return this;
    }

    public DivisionDataContextBuilder WithAllTeamsInSameDivision(DivisionDto division, params TeamDto[] teams)
    {
        foreach (var team in teams)
        {
            _teamIdToDivisionIdLookup[team.Id] = division.Id;
        }
        return this;
    }

    public DivisionDataContextBuilder WithDivision(DivisionDto division)
    {
        _divisionLookup.Add(division.Id, division);
        return this;
    }

    public DivisionDataContext Build()
    {
        return new DivisionDataContext(
            _games,
            _teams,
            _tournamentGames,
            _notes,
            _season,
            _teamIdToDivisionIdLookup,
            _divisionLookup,
            _filter);
    }
}