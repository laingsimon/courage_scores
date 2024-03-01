using CourageScores.Services;
using Microsoft.Extensions.Configuration;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services;

[TestFixture]
public class PhotoSettingsTests
{
    [TestCase("1000", 1000)]
    [TestCase("", 1024)]
    [TestCase("not a number", 1024)]
    [TestCase(null, 1024)]
    public void MinPhotoFileSize_WhenAccessed_ReturnsAppropriateValue(string? configuredValue, long expectedValue)
    {
        var config = new Mock<IConfiguration>();
        var photoSettingsConfig = new Mock<IConfigurationSection>();
        config.Setup(c => c.GetSection("PhotoSettings")).Returns(photoSettingsConfig.Object);
        if (configuredValue != null)
        {
            photoSettingsConfig.Setup(c => c["MinPhotoFileSize"]).Returns(configuredValue);
        }

        var settings = new PhotoSettings(config.Object);

        Assert.That(settings.MinPhotoFileSize, Is.EqualTo(expectedValue));
    }

    [TestCase("2", 2)]
    [TestCase("", 2)]
    [TestCase("not a number", 2)]
    [TestCase(null, 2)]
    public void MaxPhotoCountPerEntity_WhenAccessed_ReturnsAppropriateValue(string? configuredValue, int expectedValue)
    {
        var config = new Mock<IConfiguration>();
        var photoSettingsConfig = new Mock<IConfigurationSection>();
        config.Setup(c => c.GetSection("PhotoSettings")).Returns(photoSettingsConfig.Object);
        if (configuredValue != null)
        {
            photoSettingsConfig.Setup(c => c["MaxPhotoCountPerEntity"]).Returns(configuredValue);
        }

        var settings = new PhotoSettings(config.Object);

        Assert.That(settings.MaxPhotoCountPerEntity, Is.EqualTo(expectedValue));
    }

    [TestCase("1000", 1000)]
    [TestCase("", 5000)]
    [TestCase("not a number", 5000)]
    [TestCase(null, 5000)]
    public void MaxPhotoHeight_WhenAccessed_ReturnsAppropriateValue(string? configuredValue, int expectedValue)
    {
        var config = new Mock<IConfiguration>();
        var photoSettingsConfig = new Mock<IConfigurationSection>();
        config.Setup(c => c.GetSection("PhotoSettings")).Returns(photoSettingsConfig.Object);
        if (configuredValue != null)
        {
            photoSettingsConfig.Setup(c => c["MaxPhotoHeight"]).Returns(configuredValue);
        }

        var settings = new PhotoSettings(config.Object);

        Assert.That(settings.MaxPhotoHeight, Is.EqualTo(expectedValue));
    }
}