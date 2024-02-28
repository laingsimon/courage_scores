using System.Diagnostics.CodeAnalysis;
using System.Drawing;
using System.Drawing.Imaging;
using CourageScores.Services;
using NUnit.Framework;

namespace CourageScores.Tests.Services;

[TestFixture]
[SuppressMessage("ReSharper", "ConvertToUsingDeclaration")]
public class PhotoHelperTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private PhotoHelper _helper = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _helper = new PhotoHelper();
    }

    [Test]
    public async Task Resize_GivenNonImageFile_ReturnsUnsuccessful()
    {
        var result = await _helper.ResizePhoto(new byte[] { 0, 1, 2, 3 }, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not a valid photo" }));
    }

    [Test]
    public async Task Resize_GivenSmallImageFile_ReturnsSameImage()
    {
        var smallPhoto = GetImageAtSize(100, 100);

        var result = await _helper.ResizePhoto(smallPhoto, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.EqualTo(smallPhoto));
    }

    [Test]
    public async Task Resize_GivenLargeSquareImageFile_ReturnsResizedImage()
    {
        var largePhoto = GetImageAtSize(PhotoHelper.MaxHeight * 2, PhotoHelper.MaxHeight * 2);

        var result = await _helper.ResizePhoto(largePhoto, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(GetImageSize(result.Result!), Is.EqualTo(new Size(PhotoHelper.MaxHeight, PhotoHelper.MaxHeight)));
    }

    [Test]
    public async Task Resize_GivenLargePortraitImageFile_ReturnsResizedImageRespectingAspectRatio()
    {
        var largePortraitPhoto = GetImageAtSize(PhotoHelper.MaxHeight * 2, PhotoHelper.MaxHeight * 4);

        var result = await _helper.ResizePhoto(largePortraitPhoto, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(GetImageSize(result.Result!), Is.EqualTo(new Size(PhotoHelper.MaxHeight / 2, PhotoHelper.MaxHeight)));
    }

    [Test]
    public async Task Resize_GivenLargeLandscapeImageFile_ReturnsResizedImageRespectingAspectRatio()
    {
        var largePortraitPhoto = GetImageAtSize(PhotoHelper.MaxHeight * 4, PhotoHelper.MaxHeight * 2);

        var result = await _helper.ResizePhoto(largePortraitPhoto, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(GetImageSize(result.Result!), Is.EqualTo(new Size(PhotoHelper.MaxHeight * 2, PhotoHelper.MaxHeight)));
    }

    private static byte[] GetImageAtSize(int width, int height)
    {
        // TODO: Use a different function to allow this to function on a non-windows host

        using (var image = new Bitmap(width, height))
        using (var graphics = Graphics.FromImage(image))
        {
            graphics.FillRectangle(Brushes.Azure, 0, 0, width, height);

            graphics.Save();

            var stream = new MemoryStream();
            image.Save(stream, ImageFormat.Png);
            return stream.ToArray();
        }
    }

    private static Size GetImageSize(byte[] photo)
    {
        // TODO: Use a different function to allow this to function on a non-windows host

        using (var image = Image.FromStream(new MemoryStream(photo)))
        {
            return image.Size;
        }
    }
}