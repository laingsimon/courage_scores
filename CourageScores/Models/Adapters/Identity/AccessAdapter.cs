using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Adapters.Identity;

public class AccessAdapter : ISimpleAdapter<Access, AccessDto>
{
    public AccessDto Adapt(Access model)
    {
        return new AccessDto
        {
            ManageAccess = model.ManageAccess,
            ManageDivisions = model.ManageDivisions,
            ManageGames = model.ManageGames,
            ManagePlayers = model.ManagePlayers,
            ManageScores = model.ManageScores,
            ManageSeasons = model.ManageSeasons,
            ManageTeams = model.ManageTeams,
            RunReports = model.RunReports,
            ExportData = model.ExportData,
            ImportData = model.ImportData,
            InputResults = model.InputResults,
        };
    }

    public Access Adapt(AccessDto dto)
    {
        return new Access
        {
            ManageAccess = dto.ManageAccess,
            ManageDivisions = dto.ManageDivisions,
            ManageGames = dto.ManageGames,
            ManagePlayers = dto.ManagePlayers,
            ManageScores = dto.ManageScores,
            ManageSeasons = dto.ManageSeasons,
            ManageTeams = dto.ManageTeams,
            RunReports = dto.RunReports,
            ExportData = dto.ExportData,
            ImportData = dto.ImportData,
            InputResults = dto.InputResults,
        };
    }
}