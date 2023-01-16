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
        });
    }
}