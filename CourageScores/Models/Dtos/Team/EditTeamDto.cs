﻿using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Team;

[ExcludeFromCodeCoverage]
public class EditTeamDto : IIntegrityCheckDto
{
    public Guid? Id { get; set; }
    public string Name { get; set; } = null!;
    public string Address { get; set; } = null!;
    public Guid DivisionId { get; set; }
    public Guid SeasonId { get; set; }
    public Guid NewDivisionId { get; set; }
    public DateTime? LastUpdated { get; set; }
}