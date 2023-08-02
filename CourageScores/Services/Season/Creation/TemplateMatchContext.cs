using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
﻿using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Services.Season.Creation;

[ExcludeFromCodeCoverage]
public class TemplateMatchContext
{
    public SeasonDto SeasonDto { get; }
    public List<DivisionDataDto> Divisions { get; }

    public TemplateMatchContext(SeasonDto seasonDto, IEnumerable<DivisionDataDto> divisions)
    {
        SeasonDto = seasonDto;
        Divisions = divisions.ToList();
    }
}
