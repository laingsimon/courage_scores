using Newtonsoft.Json;

namespace DataImport;

public class NameComparer : INameComparer
{
    private readonly Dictionary<string, NameMapping> _mapping;

    public NameComparer()
    {
        _mapping = JsonConvert.DeserializeObject<Dictionary<string, NameMapping>>(File.ReadAllText("players.json"))!;
    }

    public bool PlayerNameEquals(string cosmosName, string accessName, string teamName)
    {
        if (cosmosName.Trim().Equals(accessName.Trim()))
        {
            return true;
        }

        if (_mapping.TryGetValue(accessName.Trim(), out var cosmosMapping) && cosmosMapping.Team.Trim() == teamName.Trim())
        {
            return cosmosMapping.PlayerName.Equals(cosmosName.Trim());
        }

        return false;
    }

    // players.json
    private class NameMapping
    {
        [JsonProperty("team")]
        public string Team { get; set; } = null!;
        [JsonProperty("player")]
        public string PlayerName { get; set; } = null!;
    }
}