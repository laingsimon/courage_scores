using CourageScores.Models;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Http;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class UploadPhotoCommandTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private Mock<IPhotoService> _photoService = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<IFormFile> _photo = null!;
    private UserDto? _user;
    private CosmosGame _game = null!;
    private UploadPhotoCommand _command = null!;
    private byte[] _fileContents = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _photoService = new Mock<IPhotoService>();
        _user = new UserDto
        {
            Access = new AccessDto
            {
                UploadPhotos = true,
            },
            Name = "USER",
        };
        _game = new CosmosGame
        {
            Id = Guid.NewGuid(),
        };
        _photo = new Mock<IFormFile>();
        _fileContents = Enumerable.Range(0, UploadPhotoCommand.MinFileSize).Select(_ => (byte)1).ToArray();
        _photo
            .Setup(p => p.CopyToAsync(It.IsAny<MemoryStream>(), _token))
            .Callback((Stream stream, CancellationToken _) =>
            {
                stream.Write(_fileContents, 0, _fileContents.Length);
            });

        _command = new UploadPhotoCommand(_userService.Object, _photoService.Object)
            .WithPhoto(_photo.Object);

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
    }

    [Test]
    public async Task ApplyUpdate_WhenLoggedOut_ReturnsNotPermitted()
    {
        _user = null;

        var result = await _command.ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
    }

    [Test]
    public async Task ApplyUpdate_WhenNotPermitted_ReturnsNotPermitted()
    {
        _user!.Access!.UploadPhotos = false;

        var result = await _command.ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
    }

    [Test]
    public async Task ApplyUpdate_GivenEmptyFile_ReturnsWarning()
    {
        _fileContents = Array.Empty<byte>();

        var result = await _command.ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "File is empty" }));
    }

    [Test]
    public async Task ApplyUpdate_GivenFile_CallsPhotoServiceCorrectly()
    {
        var unsuccessful = new ActionResult<PhotoReference>(); // success = false
        var photo = new Parameter<Photo>();
        _photoService
            .Setup(s => s.Upsert(It.Is<Photo>(p => photo.Capture(p)), _token))
            .ReturnsAsync(unsuccessful);
        var teamId = Guid.NewGuid();
        var fileName = "FILE.png";
        var contentType = "image/png";
        _user!.TeamId = teamId;
        _photo.Setup(p => p.FileName).Returns(fileName);
        _photo.Setup(p => p.ContentType).Returns(contentType);

        await _command.ApplyUpdate(_game, _token);

        _photoService.Verify(s => s.Upsert(It.IsAny<Photo>(), _token));
        Assert.That(photo.Value!.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(photo.Value!.TeamId, Is.EqualTo(teamId));
        Assert.That(photo.Value!.ContentType, Is.EqualTo(contentType));
        Assert.That(photo.Value!.EntityId, Is.EqualTo(_game.Id));
        Assert.That(photo.Value!.FileName, Is.EqualTo(fileName));
        Assert.That(photo.Value!.PhotoBytes, Is.EqualTo(_fileContents));
    }

    [Test]
    public async Task ApplyUpdate_WhenPhotoServiceReturnsFailure_ReturnsPhotoServiceResult()
    {
        var unsuccessful = new ActionResult<PhotoReference>
        {
            Success = false,
            Warnings = { "UNSUCCESSFUL" },
        };
        _photoService
            .Setup(s => s.Upsert(It.IsAny<Photo>(), _token))
            .ReturnsAsync(unsuccessful);

        var result = await _command.ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "UNSUCCESSFUL" }));
        Assert.That(_game.Photos, Is.Empty);
    }

    [Test]
    public async Task ApplyUpdate_WhenGameHasNoPhotos_AddsPhoto()
    {
        var photoReference = new PhotoReference
        {
            Id = Guid.NewGuid(),
        };
        var successful = new ActionResult<PhotoReference>
        {
            Success = true,
            Result = photoReference,
        };
        _photoService
            .Setup(s => s.Upsert(It.IsAny<Photo>(), _token))
            .ReturnsAsync(successful);

        var result = await _command.ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "Photo added" }));
        Assert.That(_game.Photos, Is.EquivalentTo(new[] { photoReference }));
    }

    [Test]
    public async Task ApplyUpdate_WhenGameHasPhotoFromExistingUser_ReplacesPhoto()
    {
        var existingPhotoId = Guid.NewGuid();
        var photoReference = new PhotoReference
        {
            Id = Guid.NewGuid(),
        };
        var successful = new ActionResult<PhotoReference>
        {
            Success = true,
            Result = photoReference,
        };
        _photoService
            .Setup(s => s.Upsert(It.IsAny<Photo>(), _token))
            .ReturnsAsync(successful);
        _game.Photos.Add(new PhotoReference
        {
            Id = existingPhotoId,
            Author = _user!.Name,
        });

        var result = await _command.ApplyUpdate(_game, _token);

        _photoService.Verify(s => s.Upsert(It.Is<Photo>(p => p.Id == existingPhotoId), _token));
        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "Photo added" }));
        Assert.That(_game.Photos, Is.EquivalentTo(new[] { photoReference }));
    }

    private class Parameter<T>
    {
        public T? Value { get; set; }

        public bool Capture(T value)
        {
            Value = value;
            return true;
        }
    }
}