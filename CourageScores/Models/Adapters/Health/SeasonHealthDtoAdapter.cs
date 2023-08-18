using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Health;

public class SeasonHealthDtoAdapter : ISimpleOnewayAdapter<SeasonHealthDtoAdapter.SeasonAndDivisions, SeasonHealthDto>
{
    private readonly ISimpleOnewayAdapter<DivisionDataDto, DivisionHealthDto> _divisionAdapter;

    public SeasonHealthDtoAdapter(ISimpleOnewayAdapter<DivisionDataDto, DivisionHealthDto> divisionAdapter)
    {
        _divisionAdapter = divisionAdapter;
    }

    public async Task<SeasonHealthDto> Adapt(SeasonAndDivisions model, CancellationToken token)
    {
        return new SeasonHealthDto
        {
            Divisions = await model.Divisions.SelectAsync(d => _divisionAdapter.Adapt(d, token)).ToList(),
            StartDate = model.Season.StartDate,
            EndDate = model.Season.EndDate,
            Id = model.Season.Id,
            Name = model.Season.Name,
        };
    }

    public class SeasonAndDivisions
    {
        public SeasonAndDivisions(SeasonDto season, List<DivisionDataDto> divisions)
        {
            Season = season;
            Divisions = divisions;
        }

        public SeasonDto Season { get; }
        public List<DivisionDataDto> Divisions { get; }
    }
}