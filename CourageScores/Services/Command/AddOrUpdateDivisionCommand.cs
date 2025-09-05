using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services.Season;
using CosmosDivision = CourageScores.Models.Cosmos.Division;
using CosmosSeason = CourageScores.Models.Cosmos.Season.Season;

namespace CourageScores.Services.Command;

public class AddOrUpdateDivisionCommand : AddOrUpdateCommand<CosmosDivision, EditDivisionDto>
{
    private readonly ScopedCacheManagementFlags _cacheFlags;
    private readonly ISeasonService _seasonService;

    public AddOrUpdateDivisionCommand(ScopedCacheManagementFlags cacheFlags, ISeasonService seasonService)
    {
        _cacheFlags = cacheFlags;
        _seasonService = seasonService;
    }

    protected override async Task<ActionResult<CosmosDivision>> ApplyUpdates(CosmosDivision division,
        EditDivisionDto update, CancellationToken token)
    {
        division.Name = update.Name.TrimOrDefault();
        division.Superleague = update.Superleague;
        _cacheFlags.EvictDivisionDataCacheForDivisionId = division.Id;

        var seasons = await _seasonService.GetAll(token).ToList();
        var updateSeasonDivisionCommand = new UpdateSeasonDivisionCommand(division, _cacheFlags);

        foreach (var season in seasons)
        {
            await _seasonService.Upsert(season.Id, updateSeasonDivisionCommand, token);
        }

        return new ActionResult<CosmosDivision>
        {
            Success = true,
            Messages =
            {
                "Division updated",
            },
        };
    }

    private class UpdateSeasonDivisionCommand : IUpdateCommand<CosmosSeason, SeasonDto>
    {
        private readonly CosmosDivision _division;
        private readonly ScopedCacheManagementFlags _cacheFlags;

        public UpdateSeasonDivisionCommand(CosmosDivision division, ScopedCacheManagementFlags cacheFlags)
        {
            _division = division;
            _cacheFlags = cacheFlags;
        }

        public Task<ActionResult<SeasonDto>> ApplyUpdate(CosmosSeason season, CancellationToken token)
        {
            var seasonDivisions = season.Divisions.Where(d => d.Id == _division.Id);

            foreach (var seasonDivision in seasonDivisions)
            {
                seasonDivision.Name = _division.Name;
                seasonDivision.Superleague = _division.Superleague;
                _cacheFlags.EvictDivisionDataCacheForSeasonId = season.Id;
            }

            return Task.FromResult(new ActionResult<SeasonDto>
            {
                Success = true,
            });
        }
    }
}
