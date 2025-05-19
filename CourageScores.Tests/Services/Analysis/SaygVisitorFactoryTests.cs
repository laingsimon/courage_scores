using CourageScores.Models.Dtos.Analysis;
using CourageScores.Services.Analysis;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Analysis;

[TestFixture]
public class SaygVisitorFactoryTests
{
    [Test]
    public void CreateForRequest_WhenCalled_CreatesVisitors()
    {
        var request = new AnalysisRequestDto();
        var factory = new SaygVisitorFactory();

        var result = factory.CreateForRequest(request);

        Assert.That(result, Is.Not.Null);
    }
}