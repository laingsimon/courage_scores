using CourageScores.Models.Dtos.Team;

namespace CourageScores.Repository;

public class TeamRepository : ITeamRepository
{
    private static readonly BaseDataRepository<TeamDto> Data = new BaseDataRepository<TeamDto>(t => t.Id);

    static TeamRepository()
    {
        var team = new TeamDto
        {
            Address = "The riv",
            Id = Guid.NewGuid(),
            Name = "Riverside",
            Seasons = new[]
            {
                new TeamSeasonDto
                {
                    SeasonId = Guid.NewGuid(),
                    Players = new[]
                    {
                        new TeamPlayerDto
                        {
                            Id = Guid.NewGuid(),
                            Name = "Colbs",
                            Captain = true,
                        },
                        new TeamPlayerDto
                        {
                            Id = Guid.NewGuid(),
                            Name = "Donk",
                        },
                    }
                },
                new TeamSeasonDto
                {
                    SeasonId = Guid.NewGuid(),
                    Players = new[]
                    {
                        new TeamPlayerDto
                        {
                            Id = Guid.NewGuid(),
                            Name = "Colbs",
                            Captain = true,
                        },
                        new TeamPlayerDto
                        {
                            Id = Guid.NewGuid(),
                            Name = "Donk",
                        },
                        new TeamPlayerDto
                        {
                            Id = Guid.NewGuid(),
                            Name = "Simon",
                        },
                    }
                },
            },
            DivisionId = Guid.NewGuid(),
        };

        Data.Create(team).Wait();
    }

    public async Task<TeamDto> Get(Guid id)
    {
        return await Data.Get(id);
    }

    public IAsyncEnumerable<TeamDto> GetAll()
    {
        return Data.GetAll();
    }
}