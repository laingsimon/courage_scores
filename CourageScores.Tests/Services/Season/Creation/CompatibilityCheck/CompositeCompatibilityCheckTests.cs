using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Season.Creation;
using CourageScores.Services.Season.Creation.CompatibilityCheck;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season.Creation.CompatibilityCheck;

[TestFixture]
public class CompositeCompatibilityCheckTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly TemplateDto _template = new TemplateDto();
    private readonly TemplateMatchContext _context = new TemplateMatchContext(new SeasonDto(), new[] { new DivisionDataDto() }, new Dictionary<Guid, TeamDto[]>());

    [Test]
    public async Task Check_GivenNoChecks_ReturnsSuccess()
    {
        var check = new CompositeCompatibilityCheck(Array.Empty<ICompatibilityCheck>());

        var result = await check.Check(_template, _context, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task Check_GivenUnsuccessfulCheck_ReturnsFail()
    {
        var underlyingCheck = new Mock<ICompatibilityCheck>();
        var check = new CompositeCompatibilityCheck(new[] { underlyingCheck.Object });
        underlyingCheck
            .Setup(c => c.Check(_template, _context, _token))
            .ReturnsAsync(new ActionResultDto<TemplateDto> { Success = false });

        var result = await check.Check(_template, _context, _token);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task Check_GivenSuccessfulCheck_ReturnsSuccess()
    {
        var underlyingCheck = new Mock<ICompatibilityCheck>();
        var check = new CompositeCompatibilityCheck(new[] { underlyingCheck.Object });
        underlyingCheck
            .Setup(c => c.Check(_template, _context, _token))
            .ReturnsAsync(new ActionResultDto<TemplateDto> { Success = true });

        var result = await check.Check(_template, _context, _token);

        Assert.That(result.Success, Is.True);
    }

    [TestCase(true)]
    [TestCase(false)]
    public async Task Check_GivenErrorsReturned_CombinesAllErrors(bool success)
    {
        var underlyingCheck = new Mock<ICompatibilityCheck>();
        var check = new CompositeCompatibilityCheck(new[] { underlyingCheck.Object });
        underlyingCheck
            .Setup(c => c.Check(_template, _context, _token))
            .ReturnsAsync(new ActionResultDto<TemplateDto> { Success = success, Errors = { "ERROR" }});

        var result = await check.Check(_template, _context, _token);

        Assert.That(result.Errors, Is.EquivalentTo(new[] { "ERROR" }));
    }

    [TestCase(true)]
    [TestCase(false)]
    public async Task Check_GivenWarningsReturned_CombinesAllWarnings(bool success)
    {
        var underlyingCheck = new Mock<ICompatibilityCheck>();
        var check = new CompositeCompatibilityCheck(new[] { underlyingCheck.Object });
        underlyingCheck
            .Setup(c => c.Check(_template, _context, _token))
            .ReturnsAsync(new ActionResultDto<TemplateDto> { Success = success, Warnings = { "WARNING" }});

        var result = await check.Check(_template, _context, _token);

        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "WARNING" }));
    }

    [TestCase(true)]
    [TestCase(false)]
    public async Task Check_GivenMessagesReturned_CombinesAllMessages(bool success)
    {
        var underlyingCheck = new Mock<ICompatibilityCheck>();
        var check = new CompositeCompatibilityCheck(new[] { underlyingCheck.Object });
        underlyingCheck
            .Setup(c => c.Check(_template, _context, _token))
            .ReturnsAsync(new ActionResultDto<TemplateDto> { Success = success, Messages = { "MESSAGE" }});

        var result = await check.Check(_template, _context, _token);

        Assert.That(result.Messages, Is.EquivalentTo(new[] { "MESSAGE" }));
    }
}