using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Team;
using DataImport.Lookup;

namespace DataImport.Importers;

public class ImportContext
{
    public StatefulLookup<string, Team>? Teams { get; set; }
    public StatefulLookup<string, Game>? Fixtures { get; set; }

    /// <summary>
    /// Mapping from Player-code -> Player-name
    /// </summary>
    public Dictionary<string, TeamPlayer> PlayerNameLookup { get; set; } = new Dictionary<string, TeamPlayer>(StringComparer.OrdinalIgnoreCase);
}