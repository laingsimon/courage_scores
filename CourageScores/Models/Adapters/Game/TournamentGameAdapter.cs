﻿using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Game;

public class TournamentGameAdapter : IAdapter<TournamentGame, TournamentGameDto>
{
    private readonly IAdapter<NotableTournamentPlayer, NotableTournamentPlayerDto> _notablePlayerAdapter;
    private readonly IAdapter<TournamentPlayer, TournamentPlayerDto> _playerAdapter;
    private readonly IAdapter<TournamentRound, TournamentRoundDto> _roundAdapter;
    private readonly ISimpleAdapter<TournamentSide, TournamentSideDto> _sideAdapter;
    private readonly ISimpleAdapter<PhotoReference, PhotoReferenceDto> _photoReferenceAdapter;

    public TournamentGameAdapter(
        IAdapter<TournamentRound, TournamentRoundDto> roundAdapter,
        ISimpleAdapter<TournamentSide, TournamentSideDto> sideAdapter,
        IAdapter<TournamentPlayer, TournamentPlayerDto> playerAdapter,
        IAdapter<NotableTournamentPlayer, NotableTournamentPlayerDto> notablePlayerAdapter,
        ISimpleAdapter<PhotoReference, PhotoReferenceDto> photoReferenceAdapter)
    {
        _roundAdapter = roundAdapter;
        _sideAdapter = sideAdapter;
        _playerAdapter = playerAdapter;
        _notablePlayerAdapter = notablePlayerAdapter;
        _photoReferenceAdapter = photoReferenceAdapter;
    }

    public async Task<TournamentGameDto> Adapt(TournamentGame model, CancellationToken token)
    {
        return new TournamentGameDto
        {
            Id = model.Id,
            Round = model.Round != null ? await _roundAdapter.Adapt(model.Round, token) : null,
            Date = model.Date,
            Sides = await model.Sides.SelectAsync(s => _sideAdapter.Adapt(s, token)).ToList(),
            SeasonId = model.SeasonId,
            Address = model.Address,
            OneEighties = await model.OneEighties.SelectAsync(player => _playerAdapter.Adapt(player, token)).ToList(),
            Over100Checkouts = await model.Over100Checkouts.SelectAsync(player => _notablePlayerAdapter.Adapt(player, token)).ToList(),
            Notes = model.Notes.TrimOrDefault(),
            Type = model.Type.TrimOrDefault(),
            AccoladesCount = model.AccoladesCount,
            DivisionId = model.DivisionId,
            BestOf = model.BestOf,
            SingleRound = model.SingleRound,
            Host = model.Host,
            Opponent = model.Opponent,
            Gender = model.Gender,
            Photos = await model.Photos.SelectAsync(p => _photoReferenceAdapter.Adapt(p, token)).ToList(),
            ExcludeFromReports = model.ExcludeFromReports,
        }.AddAuditProperties(model);
    }

    public async Task<TournamentGame> Adapt(TournamentGameDto dto, CancellationToken token)
    {
        return new TournamentGame
        {
            Id = dto.Id,
            Round = dto.Round != null ? await _roundAdapter.Adapt(dto.Round, token) : null,
            Date = dto.Date,
            Sides = await dto.Sides.SelectAsync(s => _sideAdapter.Adapt(s, token)).ToList(),
            SeasonId = dto.SeasonId,
            Address = dto.Address.TrimOrDefault(),
            OneEighties = await dto.OneEighties.SelectAsync(player => _playerAdapter.Adapt(player, token)).ToList(),
            Over100Checkouts = await dto.Over100Checkouts.SelectAsync(player => _notablePlayerAdapter.Adapt(player, token)).ToList(),
            Notes = dto.Notes?.Trim(),
            Type = dto.Type?.Trim(),
            AccoladesCount = dto.AccoladesCount,
            DivisionId = dto.DivisionId,
            BestOf = dto.BestOf,
            SingleRound = dto.SingleRound,
            Host = dto.Host?.Trim(),
            Opponent = dto.Opponent?.Trim(),
            Gender = dto.Gender?.Trim(),
            Photos = await dto.Photos.SelectAsync(p => _photoReferenceAdapter.Adapt(p, token)).ToList(),
            ExcludeFromReports = dto.ExcludeFromReports,
        }.AddAuditProperties(dto);
    }
}
