using CourageScores.Models;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services;

[TestFixture]
public class PhotoServiceTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private Mock<IUserService> _userService = null!;
    private Mock<IPhotoRepository> _photoRepository = null!;
    private Mock<IPhotoHelper> _photoHelper = null!;
    private Mock<ISystemClock> _clock = null!;
    private UserDto? _user;

    private PhotoService _service = null!;
    private Photo _photo = null!;
    private Photo _existingPhoto = null!;
    private byte[] _resizedBytes = null!;
    private DateTimeOffset _now;
    private MutablePhotoSettings _settings = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _photoRepository = new Mock<IPhotoRepository>();
        _photoHelper = new Mock<IPhotoHelper>();
        _clock = new Mock<ISystemClock>();
        _now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        _resizedBytes = new byte[] { 5, 6, 7, 8 };
        _settings = new MutablePhotoSettings
        {
            MaxPhotoHeight = 5000,
        };
        _user = new UserDto
        {
            Access = new AccessDto
            {
                UploadPhotos = true,
                ManageScores = true,
            },
            Name = "USER",
        };
        _photo = new Photo
        {
            Id = Guid.NewGuid(),
            PhotoBytes = new byte[] { 1, 2, 3, 4 },
            ContentType = "image/png",
            FileName = "photo.png",
            Author = "USER",
        };
        _existingPhoto = new Photo
        {
            Id = Guid.NewGuid(),
            PhotoBytes = new byte[]
            {
                1, 2, 3, 4,
            },
        };
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _clock.Setup(c => c.UtcNow).Returns(_now);
        _photoRepository.Setup(r => r.Get(_existingPhoto.Id, _token)).ReturnsAsync(_existingPhoto);

        _service = new PhotoService(_userService.Object, _photoRepository.Object, _photoHelper.Object, _clock.Object, _settings);
    }

    [Test]
    public async Task Upsert_WhenLoggedOut_ReturnsNotPermitted()
    {
        _user = null;

        var result = await _service.Upsert(_photo, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
    }

    [Test]
    public async Task Upsert_WhenNotPermitted_ReturnsNotPermitted()
    {
        _user!.Access!.UploadPhotos = false;

        var result = await _service.Upsert(_photo, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
    }

    [Test]
    public async Task Upsert_GivenPhoto_ResizesThenStoresPhoto()
    {
        var resizeResult = new ActionResult<byte[]>
        {
            Success = true,
            Result = _resizedBytes,
        };
        _photoHelper.Setup(h => h.ResizePhoto(_photo.PhotoBytes, _settings.MaxPhotoHeight, _token)).ReturnsAsync(resizeResult);

        var result = await _service.Upsert(_photo, _token);

        _photoRepository.Verify(r => r.Upsert(_photo, _token));
        _photoRepository.Verify(r => r.Upsert(It.Is<Photo>(p => p.PhotoBytes == _resizedBytes), _token));
        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.Id, Is.EqualTo(_photo.Id));
        Assert.That(result.Result!.Author, Is.EqualTo(_user!.Name));
        Assert.That(result.Result!.ContentType, Is.EqualTo(_photo.ContentType));
        Assert.That(result.Result!.FileName, Is.EqualTo(_photo.FileName));
        Assert.That(result.Result!.Created, Is.EqualTo(_now));
        Assert.That(result.Result!.FileSize, Is.EqualTo(_resizedBytes.Length));
    }

    [Test]
    public async Task Upsert_GivenNonPhotoFile_ReturnsUnsuccessful()
    {
        var resizeResult = new ActionResult<byte[]>
        {
            Success = false,
            Result = null,
            Warnings = { "Not a valid photo file" },
        };
        _photoHelper.Setup(h => h.ResizePhoto(_photo.PhotoBytes, _settings.MaxPhotoHeight, _token)).ReturnsAsync(resizeResult);

        var result = await _service.Upsert(_photo, _token);

        _photoRepository.Verify(r => r.Upsert(It.IsAny<Photo>(), _token), Times.Never);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not a valid photo file" }));
    }

    [Test]
    public async Task Upsert_GivenNewPhoto_SetsAuthorAndEditor()
    {
        var resizeResult = new ActionResult<byte[]>
        {
            Success = true,
            Result = _resizedBytes,
        };
        _photo.Author = null!;
        _photo.Created = default;
        _photo.Editor = null!;
        _photo.Updated = default;
        _photoHelper.Setup(h => h.ResizePhoto(_photo.PhotoBytes, _settings.MaxPhotoHeight, _token)).ReturnsAsync(resizeResult);

        await _service.Upsert(_photo, _token);

        _photoRepository.Verify(r => r.Upsert(It.Is<Photo>(p => p.Author == _user!.Name && p.Editor == _user.Name && p.Created == _now.UtcDateTime && p.Updated == _now.UtcDateTime), _token));
    }

    [Test]
    public async Task Upsert_GivenReplacementPhoto_SetsEditor()
    {
        var resizeResult = new ActionResult<byte[]>
        {
            Success = true,
            Result = _resizedBytes,
        };
        _photoHelper.Setup(h => h.ResizePhoto(_photo.PhotoBytes, _settings.MaxPhotoHeight, _token)).ReturnsAsync(resizeResult);
        var created = new DateTime(2000, 01, 01, 01, 01, 01);
        _photo.Author = "AUTHOR";
        _photo.Created = created;
        _photo.Editor = null!;
        _photo.Updated = default;

        await _service.Upsert(_photo, _token);

        _photoRepository.Verify(r => r.Upsert(It.Is<Photo>(p => p.Author == "AUTHOR" && p.Editor == _user!.Name && p.Created == created && p.Updated == _now.UtcDateTime), _token));
    }

    [Test]
    public async Task GetPhoto_WhenLoggedOut_ReturnsNull()
    {
        _user = null;

        var result = await _service.GetPhoto(_existingPhoto.Id, _token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetPhoto_WhenNotPermitted_ReturnsNull()
    {
        _existingPhoto.Author = "ANOTHER USER";
        _user!.Access!.ManageScores = false;

        var result = await _service.GetPhoto(_existingPhoto.Id, _token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetPhoto_ForOwnPhotoWhenNotPermitted_ReturnsBytes()
    {
        _existingPhoto.Author = _user!.Name;
        _user!.Access!.ManageScores = false;

        var result = await _service.GetPhoto(_existingPhoto.Id, _token);

        Assert.That(result, Is.EqualTo(_existingPhoto));
    }

    [Test]
    public async Task GetPhoto_WhenPhotoNotFound_ReturnsNull()
    {
        var id = Guid.NewGuid();
        _photoRepository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => null);

        var result = await _service.GetPhoto(id, _token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetPhoto_WhenPhotoFound_ReturnsBytes()
    {
        var result = await _service.GetPhoto(_existingPhoto.Id, _token);

        Assert.That(result, Is.EqualTo(_existingPhoto));
    }

    [Test]
    public async Task Delete_WhenLoggedOut_ReturnsNotPermitted()
    {
        _user = null;

        var result = await _service.Delete(_existingPhoto.Id, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
    }

    [Test]
    public async Task Delete_WhenNotPermitted_ReturnsNotPermitted()
    {
        _user!.Access!.ManageScores = false;
        _user!.Access!.UploadPhotos = false;

        var result = await _service.Delete(_existingPhoto.Id, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
    }

    [Test]
    public async Task Delete_WhenPhotoNotFound_ReturnsNotFound()
    {
        var result = await _service.Delete(Guid.NewGuid(), _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not found" }));
    }

    [Test]
    public async Task Delete_WhenOnlyAbleToUploadPhotosAndPhotoIsFromADifferentUser_ReturnsNotPermitted()
    {
        _user!.Access!.ManageScores = false;
        _user!.Access!.UploadPhotos = true;
        _existingPhoto.Author = "ANOTHER USER";

        var result = await _service.Delete(_existingPhoto.Id, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "You can only delete your own photos" }));
    }

    [Test]
    public async Task Delete_WhenOnlyAbleToUploadPhotosAndPhotoIsFromSelf_DeletesPhoto()
    {
        _user!.Access!.ManageScores = false;
        _user!.Access!.UploadPhotos = true;
        _existingPhoto.Author = _user.Name;

        var result = await _service.Delete(_existingPhoto.Id, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.EqualTo(_existingPhoto));
        Assert.That(_existingPhoto.Deleted, Is.EqualTo(_now.UtcDateTime));
        Assert.That(_existingPhoto.Remover, Is.EqualTo(_user.Name));
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "Photo deleted" }));
        _photoRepository.Verify(r => r.Upsert(_existingPhoto, _token));
    }

    [Test]
    public async Task Delete_WhenAdminAndPhotoIsFromADifferentUser_DeletesPhoto()
    {
        _user!.Access!.ManageScores = true;
        _user!.Access!.UploadPhotos = false;
        _existingPhoto.Author = "ANOTHER USER";

        var result = await _service.Delete(_existingPhoto.Id, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.EqualTo(_existingPhoto));
        Assert.That(_existingPhoto.Deleted, Is.EqualTo(_now.UtcDateTime));
        Assert.That(_existingPhoto.Remover, Is.EqualTo(_user.Name));
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "Photo deleted" }));
        _photoRepository.Verify(r => r.Upsert(_existingPhoto, _token));
    }

    [Test]
    public async Task Delete_WhenAdminAndPhotoIsFromSelf_DeletesPhoto()
    {
        _user!.Access!.ManageScores = true;
        _user!.Access!.UploadPhotos = false;
        _existingPhoto.Author = _user.Name;

        var result = await _service.Delete(_existingPhoto.Id, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.EqualTo(_existingPhoto));
        Assert.That(_existingPhoto.Deleted, Is.EqualTo(_now.UtcDateTime));
        Assert.That(_existingPhoto.Remover, Is.EqualTo(_user.Name));
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "Photo deleted" }));
        _photoRepository.Verify(r => r.Upsert(_existingPhoto, _token));
    }
}