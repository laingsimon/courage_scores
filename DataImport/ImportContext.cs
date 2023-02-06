using CourageScores.Models.Cosmos.Team;

namespace DataImport;

public class ImportContext
{
    public StatefulLookup<string, Team>? Teams { get; set; }
}