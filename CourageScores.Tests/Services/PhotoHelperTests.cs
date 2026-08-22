using CourageScores.Services;
using NUnit.Framework;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace CourageScores.Tests.Services;

[TestFixture]
public class PhotoHelperTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private PhotoHelper _helper = null!;
    private int _maxPhotoHeight;

    [SetUp]
    public void SetupEachTest()
    {
        _maxPhotoHeight = 1000;
        _helper = new PhotoHelper();
    }

    [Test]
    public async Task Resize_GivenNonImageFile_ReturnsUnsuccessful()
    {
        var result = await _helper.ResizePhoto([0, 1, 2, 3], _maxPhotoHeight, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Not a valid photo"]));
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
        var path = Path.GetFullPath("test-photo.png");
        using var imageStream = File.OpenRead(path);
        using var image = Image.Load(imageStream);

        return ScaleImageToSize(image, new Size(width, height));
    }

    private static byte[] ScaleImageToSize(Image src, Size requiredSize)
    {
        var stream = new MemoryStream();

        src.Mutate(img => img.Resize(requiredSize));
        src.Save(stream, src.Metadata.DecodedImageFormat!);

        return stream.ToArray();
    }

    private static Size GetImageSize(byte[] photo)
    {
        using var image = Image.Load(new MemoryStream(photo));
        return image.Size;
    }
}
