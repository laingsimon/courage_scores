using CourageScores.Models.Cosmos.Team;
using DataImport.Lookup;

namespace DataImport.Importers;

public class ImportContext
{
    public StatefulLookup<string, Team>? Teams { get; set; }
}