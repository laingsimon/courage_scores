﻿using CourageScores.Models.Adapters.Team;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Team;

[TestFixture]
public class TeamSeasonAdapterTests
{
    private static readonly TeamPlayer TeamPlayer = new();
    private static readonly TeamPlayerDto TeamPlayerDto = new();
    private TeamSeasonAdapter _adapter = new(
        new MockAdapter<TeamPlayer, TeamPlayerDto>(TeamPlayer, TeamPlayerDto));
    private readonly CancellationToken _token = new();

    [Test]
    public async Task Adapt_GivenModel_MapsPropertiesSuccessfully()
    {
        var model = new TeamSeason
        {
            Id = Guid.NewGuid(),
            Players =
            {
                TeamPlayer,
            },
            SeasonId = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.SeasonId, Is.EqualTo(model.SeasonId));
        Assert.That(result.DivisionId, Is.EqualTo(model.DivisionId));
        Assert.That(result.Players, Is.EqualTo(new[]
        {
            TeamPlayerDto,
        }));
    }

    [Test]
    public async Task Adapt_GivenDto_MapsPropertiesSuccessfully()
    {
        var dto = new TeamSeasonDto
        {
            Id = Guid.NewGuid(),
            Players =
            {
                TeamPlayerDto,
            },
            SeasonId = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.SeasonId, Is.EqualTo(dto.SeasonId));
        Assert.That(result.DivisionId, Is.EqualTo(dto.DivisionId));
        Assert.That(result.Players, Is.EqualTo(new[]
        {
            TeamPlayer,
        }));
    }
}