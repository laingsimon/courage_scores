﻿using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Cosmos.Season;

/// <summary>
/// A record of a season within the league
/// </summary>
[ExcludeFromCodeCoverage]
public class Season : AuditedEntity, IPermissionedEntity
{
    /// <summary>
    /// When the season starts
    /// </summary>
    public DateTime StartDate { get; set; }

    /// <summary>
    /// When the season ends
    /// </summary>
    public DateTime EndDate { get; set; }

    /// <summary>
    /// The divisions applicable to this season
    /// </summary>
    public List<Division> Divisions { get; set; } = new();

    /// <summary>
    /// The name of this season
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// The time fixtures are supposed to commence per date
    /// </summary>
    public TimeSpan? FixtureStartTime { get; set; }

    /// <summary>
    /// The average expected duration of each fixture, in hours
    /// </summary>
    public int? FixtureDuration { get; set; }

    [ExcludeFromCodeCoverage]
    public bool CanCreate(UserDto? user)
    {
        return user?.Access?.ManageSeasons == true;
    }

    [ExcludeFromCodeCoverage]
    public bool CanEdit(UserDto? user)
    {
        return user?.Access?.ManageSeasons == true;
    }

    [ExcludeFromCodeCoverage]
    public bool CanDelete(UserDto? user)
    {
        return user?.Access?.ManageSeasons == true;
    }
}
