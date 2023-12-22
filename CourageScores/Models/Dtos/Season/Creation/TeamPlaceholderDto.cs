using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace CourageScores.Models.Dtos.Season.Creation;

/// <summary>
/// Represents a team, by a moniker which allows the teams to vary within the rules of the division/season template
/// </summary>
[ExcludeFromCodeCoverage]
[JsonConverter(typeof(Converter))]
public class TeamPlaceholderDto
{
    public TeamPlaceholderDto(string key)
    {
        Key = key;
    }

    /// <summary>
    /// The moniker for a team
    /// </summary>
    public string Key { get; }

    private class Converter : JsonConverter<TeamPlaceholderDto>
    {
        public override void WriteJson(JsonWriter writer, TeamPlaceholderDto? value, JsonSerializer serializer)
        {
            writer.WriteValue(value?.Key);
        }

        public override TeamPlaceholderDto? ReadJson(JsonReader reader, Type objectType, TeamPlaceholderDto? existingValue, bool hasExistingValue, JsonSerializer serializer)
        {
            var value = reader.Value as string;
            return value == null ? null : new TeamPlaceholderDto(value);
        }
    }
}