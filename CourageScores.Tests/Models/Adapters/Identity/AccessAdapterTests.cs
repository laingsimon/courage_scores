using CourageScores.Models.Adapters.Identity;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Identity;

[TestFixture]
public class AccessAdapterTests
{
    private readonly AccessAdapter _adapter = new();
    private readonly CancellationToken _token = new();

    [Test]
    public async Task Adapt_GivenModel_MapsAccessCorrectly()
    {
        var model = new Access
        {
            ExportData = true,
            ImportData = true,
            InputResults = true,
            ManageAccess = true,
            ManageDivisions = true,
            ManageGames = true,
            ManageNotes = true,
            ManagePlayers = true,
            ManageScores = true,
            ManageSeasons = true,
            ManageTeams = true,
            RunReports = true,
            RecordScoresAsYouGo = true,
            ViewExceptions = true,
            ManageTournaments = true,
            RunHealthChecks = true,
            ManageSeasonTemplates = true,
            ShowDebugOptions = true,
            ManageSockets = true,
            UseWebSockets = true,
            EnterTournamentResults = true,
            UploadPhotos = true,
            ViewAnyPhoto = true,
            DeleteAnyPhoto = true,
            BulkDeleteLeagueFixtures = true,
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.ExportData, Is.EqualTo(model.ExportData));
        Assert.That(result.ImportData, Is.EqualTo(model.ImportData));
        Assert.That(result.InputResults, Is.EqualTo(model.InputResults));
        Assert.That(result.ManageAccess, Is.EqualTo(model.ManageAccess));
        Assert.That(result.ManageDivisions, Is.EqualTo(model.ManageDivisions));
        Assert.That(result.ManageGames, Is.EqualTo(model.ManageGames));
        Assert.That(result.ManageNotes, Is.EqualTo(model.ManageNotes));
        Assert.That(result.ManagePlayers, Is.EqualTo(model.ManagePlayers));
        Assert.That(result.ManageScores, Is.EqualTo(model.ManageScores));
        Assert.That(result.ManageSeasons, Is.EqualTo(model.ManageSeasons));
        Assert.That(result.ManageTeams, Is.EqualTo(model.ManageTeams));
        Assert.That(result.RunReports, Is.EqualTo(model.RunReports));
        Assert.That(result.ViewExceptions, Is.EqualTo(model.ViewExceptions));
        Assert.That(result.RecordScoresAsYouGo, Is.EqualTo(model.RecordScoresAsYouGo));
        Assert.That(result.ManageTournaments, Is.EqualTo(model.ManageTournaments));
        Assert.That(result.RunHealthChecks, Is.EqualTo(model.RunHealthChecks));
        Assert.That(result.ManageSeasonTemplates, Is.EqualTo(model.ManageSeasonTemplates));
        Assert.That(result.ShowDebugOptions, Is.EqualTo(model.ShowDebugOptions));
        Assert.That(result.ManageSockets, Is.EqualTo(model.ManageSockets));
        Assert.That(result.UseWebSockets, Is.EqualTo(model.UseWebSockets));
        Assert.That(result.EnterTournamentResults, Is.EqualTo(model.EnterTournamentResults));
        Assert.That(result.UploadPhotos, Is.EqualTo(model.UploadPhotos));
        Assert.That(result.ViewAnyPhoto, Is.EqualTo(model.ViewAnyPhoto));
        Assert.That(result.DeleteAnyPhoto, Is.EqualTo(model.DeleteAnyPhoto));
        Assert.That(result.BulkDeleteLeagueFixtures, Is.EqualTo(model.BulkDeleteLeagueFixtures));
    }

    [Test]
    public async Task Adapt_GivenDto_MapsAccessCorrectly()
    {
        var dto = new AccessDto
        {
            ExportData = true,
            ImportData = true,
            InputResults = true,
            ManageAccess = true,
            ManageDivisions = true,
            ManageGames = true,
            ManageNotes = true,
            ManagePlayers = true,
            ManageScores = true,
            ManageSeasons = true,
            ManageTeams = true,
            RunReports = true,
            ViewExceptions = true,
            RecordScoresAsYouGo = true,
            ManageTournaments = true,
            RunHealthChecks = true,
            ManageSeasonTemplates = true,
            ShowDebugOptions = true,
            ManageSockets = true,
            UseWebSockets = true,
            EnterTournamentResults = true,
            UploadPhotos = true,
            ViewAnyPhoto = true,
            DeleteAnyPhoto = true,
            BulkDeleteLeagueFixtures = true,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.ExportData, Is.EqualTo(dto.ExportData));
        Assert.That(result.ImportData, Is.EqualTo(dto.ImportData));
        Assert.That(result.InputResults, Is.EqualTo(dto.InputResults));
        Assert.That(result.ManageAccess, Is.EqualTo(dto.ManageAccess));
        Assert.That(result.ManageDivisions, Is.EqualTo(dto.ManageDivisions));
        Assert.That(result.ManageGames, Is.EqualTo(dto.ManageGames));
        Assert.That(result.ManageNotes, Is.EqualTo(dto.ManageNotes));
        Assert.That(result.ManagePlayers, Is.EqualTo(dto.ManagePlayers));
        Assert.That(result.ManageScores, Is.EqualTo(dto.ManageScores));
        Assert.That(result.ManageSeasons, Is.EqualTo(dto.ManageSeasons));
        Assert.That(result.RunReports, Is.EqualTo(dto.RunReports));
        Assert.That(result.ViewExceptions, Is.EqualTo(dto.ViewExceptions));
        Assert.That(result.RecordScoresAsYouGo, Is.EqualTo(dto.RecordScoresAsYouGo));
        Assert.That(result.ManageTournaments, Is.EqualTo(dto.ManageTournaments));
        Assert.That(result.RunHealthChecks, Is.EqualTo(dto.RunHealthChecks));
        Assert.That(result.ManageSeasonTemplates, Is.EqualTo(dto.ManageSeasonTemplates));
        Assert.That(result.ShowDebugOptions, Is.EqualTo(dto.ShowDebugOptions));
        Assert.That(result.ManageSockets, Is.EqualTo(dto.ManageSockets));
        Assert.That(result.UseWebSockets, Is.EqualTo(dto.UseWebSockets));
        Assert.That(result.EnterTournamentResults, Is.EqualTo(dto.EnterTournamentResults));
        Assert.That(result.UploadPhotos, Is.EqualTo(dto.UploadPhotos));
        Assert.That(result.ViewAnyPhoto, Is.EqualTo(dto.ViewAnyPhoto));
        Assert.That(result.DeleteAnyPhoto, Is.EqualTo(dto.DeleteAnyPhoto));
        Assert.That(result.BulkDeleteLeagueFixtures, Is.EqualTo(dto.BulkDeleteLeagueFixtures));
    }
}