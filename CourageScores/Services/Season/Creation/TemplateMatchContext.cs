using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Season.Creation;

public class TemplateMatchContext
{
    // ReSharper disable once UnusedAutoPropertyAccessor.Global
    public SeasonDto SeasonDto { get; }
    public Dictionary<Guid, TeamDto[]> Teams { get; }
    public List<DivisionDataDto> Divisions { get; }

    public TemplateMatchContext(SeasonDto seasonDto, IEnumerable<DivisionDataDto> divisions, Dictionary<Guid, TeamDto[]> teams)
    {
        SeasonDto = seasonDto;
        Teams = teams;
        Divisions = divisions.ToList();
    }

    public IReadOnlyCollection<string[]> GetSeasonSharedAddresses()
    {
        return Divisions
            .SelectMany(AddressesNotSharedWithOtherTeamsInSameDivision)
            .GroupBy(a => a, StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() > 1)
            .Select(g => g.ToArray())
            .ToArray();
    }

    public IEnumerable<DivisionSharedAddressMapping> GetDivisionMappings(TemplateDto template)
    {
        return template.Divisions
            .Zip(Divisions)
            .Select(mapping =>
            {
                var teams = Teams.TryGetValue(mapping.Second.Id, out var temp)
                    ? temp
                    : Array.Empty<TeamDto>();
                return new DivisionSharedAddressMapping(mapping.Second, mapping.First, teams);
            })
            .ToArray();
    }

    private IEnumerable<string> AddressesNotSharedWithOtherTeamsInSameDivision(DivisionDataDto division)
    {
        if (!Teams.TryGetValue(division.Id, out var teams))
        {
            return Enumerable.Empty<string>();
        }

        return teams
            .GroupBy(t => t.Address.Trim(), StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() == 1)
            .Select(g => g.Key);
    }

    public class DivisionSharedAddressMapping
    {
        public DivisionDataDto SeasonDivision { get; }
        public DivisionTemplateDto TemplateDivision { get; }
        public TeamDto[] Teams { get; }

        public DivisionSharedAddressMapping(
            DivisionDataDto seasonDivision,
            DivisionTemplateDto templateDivision,
            TeamDto[] teams)
        {
            SeasonDivision = seasonDivision;
            TemplateDivision = templateDivision;
            Teams = teams;
        }

        public IReadOnlyCollection<TeamDto[]> SharedAddressesFromSeason => Teams
                .GroupBy(t => t.Address.Trim(), StringComparer.OrdinalIgnoreCase)
                .Where(g => g.Count() > 1)
                .Select(g => g.ToArray())
                .ToArray();
    }
}
