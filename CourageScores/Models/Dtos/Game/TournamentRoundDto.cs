using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services;
using CourageScores.Services.Analysis;
using TypeScriptMapper.Dtos;

namespace CourageScores.Models.Dtos.Game;

/// <summary>
/// Represents the matches within a round of a tournament game
/// </summary>
[ExcludeFromCodeCoverage]
[PartialExtension(nameof(AuditedDto))] // to make Id optional
public class TournamentRoundDto : AuditedDto
{
    /// <summary>
    /// Optional name for the round
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// The sides that can play in the round
    /// </summary>
    public List<TournamentSideDto> Sides { get; set; } = new();

    /// <summary>
    /// The matches that are-to-be/have-been played
    /// </summary>
    public List<TournamentMatchDto> Matches { get; set; } = new();

    /// <summary>
    /// The details of the next round, winners against winners
    /// </summary>
    public TournamentRoundDto? NextRound { get; set; }

    /// <summary>
    /// Options for each match in the game
    /// </summary>
    public List<GameMatchOptionDto?> MatchOptions { get; set; } = new();

    public async Task Accept(ISaygVisitor visitor, SaygFixtureVisitorContext fixtureContext, IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> saygService, CancellationToken token)
    {
        foreach (var match in Matches)
        {
            if (token.IsCancellationRequested)
            {
                return;
            }

            await match.Accept(visitor, fixtureContext, saygService, token);
        }

        if (NextRound != null && !token.IsCancellationRequested)
        {
            await NextRound.Accept(visitor, fixtureContext, saygService, token);
        }
    }
}
