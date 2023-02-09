using System.Diagnostics.CodeAnalysis;

namespace DataImport.Models;

[SuppressMessage("ReSharper", "IdentifierTypo")]
[SuppressMessage("ReSharper", "UnusedMember.Global")]
[SuppressMessage("ReSharper", "InconsistentNaming")]
public class LegHistory
{
    public short? fixtureno { get; set; }
    public int? legkey { get; set; }
    public string? hplay { get; set; }
    public string? hplay2 { get; set; }
    public string? hplay3 { get; set; }
    public string? aplay { get; set; }
    public string? aplay2 { get; set; }
    public string? aplay3 { get; set; }
    public byte? gamplay { get; set; }
    public byte? gamwon { get; set; }
    public byte? gamlost { get; set; }
    public int? legswon { get; set; }
    public int? legslost { get; set; }
    public string? homepub { get; set; }
    public string? awaypub { get; set; }
    public DateTime? fixdate { get; set; }
    public byte? position { get; set; }
    public byte? division { get; set; }
    public string? otherplayer { get; set; }
    public string? homeplayer { get; set; }
    [AccessDbColumnName("w/l")]
    public string? WinOrLoss { get; set; }
    public string? opponents { get; set; }
    public int? playerpoints { get; set; }
}