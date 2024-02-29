using CourageScores.Services;
using NUnit.Framework;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Drawing.Processing;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace CourageScores.Tests.Services;

[TestFixture]
public class PhotoHelperTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private PhotoHelper _helper = null!;
    private int _maxPhotoHeight;

    [SetUp]
    public void SetupEachTest()
    {
        _maxPhotoHeight = 5000;
        _helper = new PhotoHelper();
    }

    [Test]
    public async Task Resize_GivenNonImageFile_ReturnsUnsuccessful()
    {
        var result = await _helper.ResizePhoto(new byte[] { 0, 1, 2, 3 }, _maxPhotoHeight, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not a valid photo" }));
    }

    [Test]
    public async Task Resize_GivenSmallImageFile_ReturnsSameImage()
    {
        var smallPhoto = GetImageAtSize(100, 100);

        var result = await _helper.ResizePhoto(smallPhoto, _maxPhotoHeight, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.EqualTo(smallPhoto));
    }

    [Test]
    public async Task Resize_GivenLargeSquareImageFile_ReturnsResizedImage()
    {
        var largePhoto = GetImageAtSize(_maxPhotoHeight * 2, _maxPhotoHeight * 2);

        var result = await _helper.ResizePhoto(largePhoto, _maxPhotoHeight, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(GetImageSize(result.Result!), Is.EqualTo(new Size(_maxPhotoHeight, _maxPhotoHeight)));
    }

    [Test]
    public async Task Resize_GivenLargePortraitImageFile_ReturnsResizedImageRespectingAspectRatio()
    {
        var largePortraitPhoto = GetImageAtSize(_maxPhotoHeight * 2, _maxPhotoHeight * 4);

        var result = await _helper.ResizePhoto(largePortraitPhoto, _maxPhotoHeight, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(GetImageSize(result.Result!), Is.EqualTo(new Size(_maxPhotoHeight / 2, _maxPhotoHeight)));
    }

    [Test]
    public async Task Resize_GivenLargeLandscapeImageFile_ReturnsResizedImageRespectingAspectRatio()
    {
        var largePortraitPhoto = GetImageAtSize(_maxPhotoHeight * 4, _maxPhotoHeight * 2);

        var result = await _helper.ResizePhoto(largePortraitPhoto, _maxPhotoHeight, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(GetImageSize(result.Result!), Is.EqualTo(new Size(_maxPhotoHeight * 2, _maxPhotoHeight)));
    }

    private static byte[] GetImageAtSize(int width, int height)
    {
        using (var image = new Image<Rgba32>(width, height))
        {
            image.Mutate(img => img.Fill(Color.Azure));

            var stream = new MemoryStream();
            image.Save(stream, new PngEncoder());
            return stream.ToArray();
        }
    }

    private static Size GetImageSize(byte[] photo)
    {
        using (var image = Image.Load(new MemoryStream(photo)))
        {
            return image.Size;
        }
    }
}