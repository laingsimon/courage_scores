using System.Diagnostics.CodeAnalysis;

namespace DataImport.Models;

[SuppressMessage("ReSharper", "IdentifierTypo")]
[SuppressMessage("ReSharper", "UnusedMember.Global")]
[SuppressMessage("ReSharper", "InconsistentNaming")]
public class Player
{
    public string? playcode { get; set; }
    public string? pubcode { get; set; }
    public string? playername { get; set; }
    public int? singplayed { get; set; }
    public byte? played { get; set; }
    public byte? won { get; set; }
    public byte? lost { get; set; }
    public int? pairswon { get; set; }
    public int? pairslost { get; set; }
    public int? threeswon { get; set; }
    public int? threeslost { get; set; }
    public int? totwin { get; set; }
    public int? totlost { get; set; }
    public byte? legswon { get; set; }
    public double? legsdiff { get; set; }
    public decimal? percentage { get; set; }
    public int? points { get; set; }
    [AccessDbColumnName("180s")]
    public byte? OneEighties { get; set; }
    public byte? hicheck { get; set; }
    public int? hicheck2 { get; set; }
    public int? hicheck3 { get; set; }
    public string? sex { get; set; }
    [AccessDbColumnName("League Ranking")]
    public int? LeagueRanking { get; set; }
    public short? windiff { get; set; }
    public string? pubname { get; set; }
    public byte? division { get; set; }
    public DateTime? dateadded { get; set; }
    public string? shortname { get; set; }
}