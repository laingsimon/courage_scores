using CourageScores.Models.Adapters.Identity;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Identity;

[TestFixture]
public class AccessAdapterTests
{
    private readonly AccessAdapter _adapter = new AccessAdapter();
    private readonly CancellationToken _token = new CancellationToken();

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
    }
}