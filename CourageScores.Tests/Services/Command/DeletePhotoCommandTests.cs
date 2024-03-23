using CourageScores.Models;
using CourageScores.Models.Cosmos;
using CourageScores.Services;
using CourageScores.Services.Command;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class DeletePhotoCommandTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private DeletePhotoCommand<CosmosGame> _command = null!;
    private Mock<IPhotoService> _photoService = null!;
    private PhotoReference _photoReference = null!;
    private CosmosGame _game = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _photoReference = new PhotoReference
        {
            Id = Guid.NewGuid(),
        };
        _game = new CosmosGame
        {
            Photos =
            {
                _photoReference
            },
        };

        _photoService = new Mock<IPhotoService>();
        _command = new DeletePhotoCommand<CosmosGame>(_photoService.Object).WithId(_photoReference.Id);
    }

    [Test]
    public async Task ApplyUpdate_WhenPhotoCannotBeDeleted_ReturnsUnsuccessful()
    {
        _photoService
            .Setup(s => s.Delete(_photoReference.Id, _token))
            .ReturnsAsync(new ActionResult<Photo>
            {
                Warnings =
                {
                    "Could not delete photo",
                },
            });

        var result = await _command.ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Could not delete photo" }));
        Assert.That(_game.Photos, Is.EquivalentTo(new[] { _photoReference }));
    }

    [Test]
    public async Task ApplyUpdate_WhenPhotoHasBeenDeleted_RemovesPhotoFromGame()
    {
        _photoService
            .Setup(s => s.Delete(_photoReference.Id, _token))
            .ReturnsAsync(new ActionResult<Photo>
            {
                Success = true,
            });

        var result = await _command.ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "Photo deleted" }));
        Assert.That(_game.Photos, Is.EquivalentTo(Array.Empty<PhotoReference>()));
    }
}