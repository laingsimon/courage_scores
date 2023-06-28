﻿using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace CourageScores.Models.Dtos.Data;

[ExcludeFromCodeCoverage]
public class ExportDataRequestDto
{
    /// <summary>
    /// A password to protect the data with
    /// </summary>
    public string? Password { get; set; }

    /// <summary>
    /// Whether deleted records should be included
    /// </summary>
    public bool IncludeDeletedEntries { get; set; }

    /// <summary>
    /// The tables, and any ids in those tables that should be exported
    /// An empty set means all tables/ids.
    /// </summary>
    [Obsolete($"Use {nameof(CaseInsensitiveTables)} instead; this instance has case-sensitive keys")]
    public Dictionary<string, List<Guid>> Tables { get; set; } = new();

    [Newtonsoft.Json.JsonIgnore]
    [JsonIgnore]
    public IDictionary<string, List<Guid>> CaseInsensitiveTables =>
        Tables.ToDictionary(t => t.Key, t => t.Value, StringComparer.OrdinalIgnoreCase);
}