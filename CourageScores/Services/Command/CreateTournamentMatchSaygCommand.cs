﻿using CourageScores.Models;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Services.Command;

public class CreateTournamentMatchSaygCommand : IUpdateCommand<TournamentGame, TournamentGame>
{
    private static readonly GameMatchOption DefaultMatchOptions = new()
    {
        NumberOfLegs = 5,
        StartingScore = 501,
    };

    private readonly ICommandFactory _commandFactory;
    private readonly IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> _saygService;
    private CreateTournamentSaygDto? _request;

    public CreateTournamentMatchSaygCommand(
        IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> saygService,
        ICommandFactory commandFactory)
    {
        _saygService = saygService;
        _commandFactory = commandFactory;
    }

    public CreateTournamentMatchSaygCommand WithRequest(CreateTournamentSaygDto request)
    {
        _request = request;
        return this;
    }

    public async Task<ActionResult<TournamentGame>> ApplyUpdate(TournamentGame model, CancellationToken token)
    {
        _request.ThrowIfNull($"{nameof(WithRequest)} must be called first");

        var match = FindMatchVisitor.FindMatch(model, _request!.MatchId);
        if (match == null)
        {
            return new ActionResult<TournamentGame>
            {
                Success = false,
                Errors =
                {
                    "Match not found",
                },
                Result = model,
            };
        }

        if (match.SaygId != null)
        {
            return new ActionResult<TournamentGame>
            {
                Success = true,
                Warnings =
                {
                    "Match already has a sayg id",
                },
                Result = model,
            };
        }

        var saygUpdate = new UpdateRecordedScoreAsYouGoDto
        {
            TournamentMatchId = match.Id,
            NumberOfLegs = _request.MatchOptions?.NumberOfLegs ?? model.BestOf ?? DefaultMatchOptions.NumberOfLegs ?? 0,
            StartingScore = _request.MatchOptions?.StartingScore ?? DefaultMatchOptions.StartingScore ?? 0,
            YourName = _request.ReverseOrder ? match.SideB.Name! : match.SideA.Name!,
            OpponentName = _request.ReverseOrder ? match.SideA.Name : match.SideB.Name,
        };
        var saygCommand = _commandFactory.GetCommand<AddOrUpdateSaygCommand>()
            .WithData(saygUpdate);

        var result = await _saygService.Upsert(saygUpdate.Id, saygCommand, token);
        if (result.Success)
        {
            match.SaygId = result.Result!.Id;
            return result.ToActionResult().As(model).Merge(new ActionResult<TournamentGame>
            {
                Success = true,
                Messages =
                {
                    "Sayg added to match",
                },
            });
        }

        return result.ToActionResult().As(model);
    }
}