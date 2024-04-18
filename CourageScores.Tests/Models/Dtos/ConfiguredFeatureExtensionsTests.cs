using CourageScores.Models.Dtos;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Dtos;

[TestFixture]
public class ConfiguredFeatureExtensionsTests
{
    [Test]
    public void GetConfiguredValue_WhenDtoIsNull_ReturnsDefaultValue()
    {
        ConfiguredFeatureDto? feature = null;

        var result = feature.GetConfiguredValue("foo");

        Assert.That(result, Is.EqualTo("foo"));
    }

    [Test]
    public void GetConfiguredValue_WhenConfiguredValueIsNull_ReturnsDefaultValue()
    {
        var feature = new ConfiguredFeatureDto
        {
            ConfiguredValue = null,
        };

        var result = feature.GetConfiguredValue("foo");

        Assert.That(result, Is.EqualTo("foo"));
    }

    [Test]
    public void GetConfiguredValue_WhenConfiguredValueIsEmpty_ReturnsDefaultValue()
    {
        var feature = new ConfiguredFeatureDto
        {
            ConfiguredValue = "",
        };

        var result = feature.GetConfiguredValue("foo");

        Assert.That(result, Is.EqualTo("foo"));
    }

    [TestCase("true", true)]
    [TestCase("TRUE", true)]
    [TestCase("True", true)]
    [TestCase("false", false)]
    [TestCase("FALSE", false)]
    [TestCase("False", false)]
    public void GetConfiguredValue_WhenConfiguredValueIsSet_CanConvertToABoolean(string configuredValue, bool expectedValue)
    {
        var feature = new ConfiguredFeatureDto
        {
            ConfiguredValue = configuredValue,
        };

        var result = feature.GetConfiguredValue<bool>();

        Assert.That(result, Is.EqualTo(expectedValue));
    }

    [Test]
    public void GetConfiguredValue_WhenConfiguredValueIsNotABool_ReturnsDefaultValue()
    {
        var feature = new ConfiguredFeatureDto
        {
            ConfiguredValue = "foo",
        };

        var result = feature.GetConfiguredValue(true);

        Assert.That(result, Is.EqualTo(true));
    }

    [TestCase("0", 0)]
    [TestCase("1", 1)]
    public void GetConfiguredValue_WhenConfiguredValueIsSet_CanConvertToAnInt(string configuredValue, int expectedValue)
    {
        var feature = new ConfiguredFeatureDto
        {
            ConfiguredValue = configuredValue,
        };

        var result = feature.GetConfiguredValue<int>();

        Assert.That(result, Is.EqualTo(expectedValue));
    }

    [Test]
    public void GetConfiguredValue_WhenConfiguredValueIsNotAnInt_ReturnsDefaultValue()
    {
        var feature = new ConfiguredFeatureDto
        {
            ConfiguredValue = "foo",
        };

        var result = feature.GetConfiguredValue(5);

        Assert.That(result, Is.EqualTo(5));
    }

    [TestCase("0", 0d)]
    [TestCase("1.0", 1d)]
    [TestCase("1.1", 1.1d)]
    public void GetConfiguredValue_WhenConfiguredValueIsSet_CanConvertToADouble(string configuredValue, double expectedValue)
    {
        var feature = new ConfiguredFeatureDto
        {
            ConfiguredValue = configuredValue,
        };

        var result = feature.GetConfiguredValue<double>();

        Assert.That(result, Is.EqualTo(expectedValue));
    }

    [TestCase("0.00:00:00", 0, 0, 0, 0)]
    [TestCase("02:03:04", 0, 2, 3, 4)]
    [TestCase("1.20:30:40", 1, 20, 30, 40)]
    public void GetConfiguredValue_WhenConfiguredValueIsSet_CanConvertToATimeSpan(string configuredValue, int days, int hours, int minutes, int seconds)
    {
        var expectedValue = new TimeSpan(days, hours, minutes, seconds);
        var feature = new ConfiguredFeatureDto
        {
            ConfiguredValue = configuredValue,
        };

        var result = feature.GetConfiguredValue<TimeSpan>();

        Assert.That(result, Is.EqualTo(expectedValue));
    }

    [Test]
    public void GetConfiguredValue_WhenConfiguredValueIsNotADouble_ReturnsDefaultValue()
    {
        var feature = new ConfiguredFeatureDto
        {
            ConfiguredValue = "foo",
        };

        var result = feature.GetConfiguredValue(-5.0d);

        Assert.That(result, Is.EqualTo(-5.0d));
    }

    [TestCase("foo", "foo")]
    public void GetConfiguredValue_WhenConfiguredValueIsSet_CanConvertToAString(string configuredValue, string expectedValue)
    {
        var feature = new ConfiguredFeatureDto
        {
            ConfiguredValue = configuredValue,
        };

        var result = feature.GetConfiguredValue<string>();

        Assert.That(result, Is.EqualTo(expectedValue));
    }
}