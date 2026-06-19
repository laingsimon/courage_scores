using System.Diagnostics.Contracts;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;

namespace CourageScores.Tests.Services;

public static class UserDtoTestExtensions
{
    public static UserDto SetAccess(
        this UserDto? user,
        bool? manageGames = null,
        bool? managePlayers = null,
        bool? manageScores = null,
        bool? manageTeams = null,
        bool? manageAccess = null,
        bool? inputResults = null,
        bool? recordScoresAsYouGo = null,
        bool? importData = null,
        bool? exportData = null,
        bool? manageSeasonTemplates = null,
        bool? manageFeatures = null,
        bool? uploadPhotos = null,
        bool? viewExceptions = null,
        bool? runHealthChecks = null,
        bool? useWebSockets = null,
        bool? manageSockets = null,
        bool? runReports = null,
        Guid? teamId = null)
    {
        user ??= new UserDto();
        user.Access ??= new AccessDto();

        var access = user.Access;
#pragma warning disable CS0618 // Type or member is obsolete
        access.ExportData = exportData ?? access.ExportData;
        access.ImportData = importData ?? access.ImportData;
        access.InputResults = inputResults ?? access.InputResults;
        access.ManageAccess = manageAccess ?? access.ManageAccess;
        access.ManageFeatures = manageFeatures ?? access.ManageFeatures;
        access.ManageGames = manageGames ?? access.ManageGames;
        access.ManagePlayers = managePlayers ?? access.ManagePlayers;
        access.ManageScores = manageScores ?? access.ManageScores;
        access.ManageSeasonTemplates = manageSeasonTemplates ?? access.ManageSeasonTemplates;
        access.ManageSockets = manageSockets ?? access.ManageSockets;
        access.ManageTeams = manageTeams ?? access.ManageTeams;
        access.RecordScoresAsYouGo = recordScoresAsYouGo ?? access.RecordScoresAsYouGo;
        access.RunHealthChecks = runHealthChecks ?? access.RunHealthChecks;
        access.RunReports = runReports ?? access.RunReports;
        access.UploadPhotos = uploadPhotos ?? access.UploadPhotos;
        access.ViewExceptions = viewExceptions ?? access.ViewExceptions;
        access.UseWebSockets = useWebSockets ?? access.UseWebSockets;
#pragma warning restore CS0618 // Type or member is obsolete

        user.TeamId = teamId ?? user.TeamId;

        return user;
    }

    [Pure]
    public static HashSet<AccessOption> With(this HashSet<AccessOption> current, params AccessOption[] options)
    {
        return current.Union(options).ToHashSet();
    }

    [Pure]
    public static HashSet<AccessOption> Without(this HashSet<AccessOption> current, params AccessOption[] options)
    {
        return current.Except(options).ToHashSet();
    }
}
