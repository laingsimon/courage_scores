using CourageScores.Models;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Tests.Models.Cosmos.Game;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Models.Adapters.Game;

public static class GameAdapterTestHelpers
{
    public static void AssertPairsAndTriplesInSameOrder(this CosmosGame model, GameDto result)
    {
        var resultPairsAndTriples = result.Matches.Skip(5).Select(m => m.Id).ToList();
        var modelPairsAndTriples = model.Matches.Skip(5).Select(m => m.Id).ToList();
        Assert.That(resultPairsAndTriples, Is.EqualTo(modelPairsAndTriples)); // pairs and triples should always be in the same order
    }

    public static void AssertSinglesInSameOrder(this CosmosGame model, GameDto result)
    {
        var resultSingles = result.Matches.Take(5).Select(m => m.Id).ToList();
        var modelSingles = model.Matches.Take(5).Select(m => m.Id).ToList();
        Assert.That(resultSingles, Is.EqualTo(modelSingles)); // assert that all the singles are in the same order
    }

    public static void AssertSinglesInRandomOrder(this CosmosGame model, GameDto result, int[] randomValues)
    {
        var resultSingles = result.Matches.Take(5).Select(m => m.Id).ToList();
        var modelSingles = model.Matches.Take(5).Select(m => m.Id).ToList();
        var expectedOrder = modelSingles.Select((match, index) => new { match, order = randomValues[index] }).ToList();
        Assert.That(resultSingles, Is.EqualTo(expectedOrder.OrderBy(a => a.order).Select(a => a.match)));
    }

    public static ConfiguredFeatureDto VetoFeatureDto(string? value)
    {
        return new ConfiguredFeatureDto
        {
            ConfiguredValue = value,
            ValueType = Feature.FeatureValueType.TimeSpan,
        };
    }

    public static ConfiguredFeatureDto RandomisesSinglesFeatureDto(string? value)
    {
        return new ConfiguredFeatureDto
        {
            ConfiguredValue = value,
            ValueType = Feature.FeatureValueType.Boolean,
        };
    }

    internal static GameMatch CreateMatch(this MockAdapter<GameMatch,GameMatchDto> matchAdapter, int matchNo)
    {
        var playerCount = 1;
        if (matchNo == 8)
        {
            playerCount = 3;
        }
        else if (matchNo >= 6)
        {
            playerCount = 2;
        }

        var players = Enumerable.Range(1, playerCount)
            .Select(playerNo => new GamePlayer { Name = $"Player {playerNo} of {playerCount}"})
            .ToArray();

        var match = new GameMatchBuilder()
            .WithScores(matchNo, 0)
            .WithHomePlayers(players)
            .WithAwayPlayers(players)
            .Build();
        matchAdapter.AddMapping(match, new GameMatchDto { Id = match.Id, HomeScore = matchNo });
        return match;
    }
}