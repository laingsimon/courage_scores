using CourageScores.Models.Adapters.Team;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Team;

[TestFixture]
public class GenderAdapterTests
{
    [TestCase(null, null)]
    [TestCase(Gender.Male, GenderDto.Male)]
    [TestCase(Gender.Female, GenderDto.Female)]
    public void ToGenderDto_GivenPossibleInputs_ReturnsCorrectly(Gender? gender, GenderDto? expected)
    {
        var result = gender.ToGenderDto();

        Assert.That(result, Is.EqualTo(expected));
    }

    [TestCase(null, null)]
    [TestCase(GenderDto.Male, Gender.Male)]
    [TestCase(GenderDto.Female, Gender.Female)]
    public void FromGenderDto_GivenPossibleInputs_ReturnsCorrectly(GenderDto? gender, Gender? expected)
    {
        var result = gender.FromGenderDto();

        Assert.That(result, Is.EqualTo(expected));
    }
}
