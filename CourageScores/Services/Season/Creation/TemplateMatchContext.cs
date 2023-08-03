using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Services.Season.Creation;

public class TemplateMatchContext
{
    // ReSharper disable once UnusedAutoPropertyAccessor.Global
    public SeasonDto SeasonDto { get; }
    public List<DivisionDataDto> Divisions { get; }

    public TemplateMatchContext(SeasonDto seasonDto, IEnumerable<DivisionDataDto> divisions)
    {
        SeasonDto = seasonDto;
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
            .Select(mapping => new DivisionSharedAddressMapping(mapping.Second, mapping.First))
            .ToArray();
    }

    private static IEnumerable<string> AddressesNotSharedWithOtherTeamsInSameDivision(DivisionDataDto division)
    {
        return division.Teams
            .GroupBy(t => t.Address.Trim(), StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() == 1)
            .Select(g => g.Key);
    }

    public class DivisionSharedAddressMapping
    {
        public DivisionDataDto SeasonDivision { get; }
        public DivisionTemplateDto TemplateDivision { get; }

        public DivisionSharedAddressMapping(
            DivisionDataDto seasonDivision,
            DivisionTemplateDto templateDivision)
        {
            SeasonDivision = seasonDivision;
            TemplateDivision = templateDivision;
        }

        public IReadOnlyCollection<DivisionTeamDto[]> SharedAddressesFromSeason => SeasonDivision.Teams
                .GroupBy(t => t.Address.Trim(), StringComparer.OrdinalIgnoreCase)
                .Where(g => g.Count() > 1)
                .Select(g => g.ToArray())
                .ToArray();
    }
}
