using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Adapters.Identity;

public class AccessAdapter : ISimpleAdapter<Access, AccessDto>
{
    public Task<AccessDto> Adapt(Access model, CancellationToken token)
    {
        return Task.FromResult(new AccessDto
        {
            ManageAccess = model.ManageAccess,
            ManageDivisions = model.ManageDivisions,
            ManageGames = model.ManageGames,
            ManageNotes = model.ManageNotes,
            ManagePlayers = model.ManagePlayers,
            ManageScores = model.ManageScores,
            ManageSeasons = model.ManageSeasons,
            ManageTeams = model.ManageTeams,
            RunReports = model.RunReports,
            ExportData = model.ExportData,
            ImportData = model.ImportData,
            InputResults = model.InputResults,
            ViewExceptions = model.ViewExceptions,
            RecordScoresAsYouGo = model.RecordScoresAsYouGo,
            ManageTournaments = model.ManageTournaments,
            RunHealthChecks = model.RunHealthChecks,
            ManageSeasonTemplates = model.ManageSeasonTemplates,
            ShowDebugOptions = model.ShowDebugOptions,
            ManageSockets = model.ManageSockets,
            UseWebSockets = model.UseWebSockets,
            EnterTournamentResults = model.EnterTournamentResults,
            UploadPhotos = model.UploadPhotos,
            DeleteAnyPhoto = model.DeleteAnyPhoto,
            ViewAnyPhoto = model.ViewAnyPhoto,
            BulkDeleteLeagueFixtures = model.BulkDeleteLeagueFixtures,
        });
    }

    public Task<Access> Adapt(AccessDto dto, CancellationToken token)
    {
        return Task.FromResult(new Access
        {
            ManageAccess = dto.ManageAccess,
            ManageDivisions = dto.ManageDivisions,
            ManageGames = dto.ManageGames,
            ManageNotes = dto.ManageNotes,
            ManagePlayers = dto.ManagePlayers,
            ManageScores = dto.ManageScores,
            ManageSeasons = dto.ManageSeasons,
            ManageTeams = dto.ManageTeams,
            RunReports = dto.RunReports,
            ExportData = dto.ExportData,
            ImportData = dto.ImportData,
            InputResults = dto.InputResults,
            ViewExceptions = dto.ViewExceptions,
            RecordScoresAsYouGo = dto.RecordScoresAsYouGo,
            ManageTournaments = dto.ManageTournaments,
            RunHealthChecks = dto.RunHealthChecks,
            ManageSeasonTemplates = dto.ManageSeasonTemplates,
            ShowDebugOptions = dto.ShowDebugOptions,
            ManageSockets = dto.ManageSockets,
            UseWebSockets = dto.UseWebSockets,
            EnterTournamentResults = dto.EnterTournamentResults,
            UploadPhotos = dto.UploadPhotos,
            DeleteAnyPhoto = dto.DeleteAnyPhoto,
            ViewAnyPhoto = dto.ViewAnyPhoto,
            BulkDeleteLeagueFixtures = dto.BulkDeleteLeagueFixtures,
        });
    }
}