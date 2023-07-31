using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using System.Text.Json.Serialization;

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

    public class Converter : JsonConverter<TeamPlaceholderDto>
    {
        public override TeamPlaceholderDto Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return new TeamPlaceholderDto(reader.GetString()!);
        }

        public override void Write(Utf8JsonWriter writer, TeamPlaceholderDto value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.Key);
        }
    }
}