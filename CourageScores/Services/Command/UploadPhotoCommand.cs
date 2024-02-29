using CourageScores.Models;
using CourageScores.Models.Cosmos;
using CourageScores.Services.Identity;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Services.Command;

public class UploadPhotoCommand : IUpdateCommand<CosmosGame, CosmosGame>
{
    private readonly IUserService _userService;
    private readonly IPhotoService _photoService;
    private readonly IPhotoSettings _settings;

    private IFormFile? _photo;

    public UploadPhotoCommand(IUserService userService, IPhotoService photoService, IPhotoSettings settings)
    {
        _userService = userService;
        _photoService = photoService;
        _settings = settings;
    }

    public UploadPhotoCommand WithPhoto(IFormFile photo)
    {
        _photo = photo;
        return this;
    }

    public async Task<ActionResult<CosmosGame>> ApplyUpdate(CosmosGame model, CancellationToken token)
    {
        _photo.ThrowIfNull($"{nameof(WithPhoto)} must be called first");

        var user = await _userService.GetUser(token);
        if (user?.Access?.UploadPhotos != true)
        {
            return new ActionResult<CosmosGame>
            {
                Success = false,
                Warnings =
                {
                    "Not permitted",
                },
            };
        }

        var fileContent = new MemoryStream();
        await _photo!.CopyToAsync(fileContent, token);

        if (fileContent.Length < _settings.MinPhotoFileSize)
        {
            return new ActionResult<CosmosGame>
            {
                Success = false,
                Warnings =
                {
                    "File is empty",
                },
            };
        }

        var existingPhotosForUser = model.Photos.Where(p => p.Author == user.Name).ToArray();

        if ((model.Photos.Count - existingPhotosForUser.Length) + 1 > _settings.MaxPhotoCountPerEntity)
        {
            return new ActionResult<CosmosGame>
            {
                Success = false,
                Warnings =
                {
                    $"No more photos can be added to this entity, maximum photo count reached: {_settings.MaxPhotoCountPerEntity}",
                },
            };
        }

        var photo = new Photo
        {
            Id = existingPhotosForUser.Select(p => p.Id).FirstOrDefault(Guid.NewGuid()),
            TeamId = user.TeamId,
            EntityId = model.Id,
            FileName = _photo.FileName,
            ContentType = _photo.ContentType,
            PhotoBytes = fileContent.ToArray(),
        };

        var result = await _photoService.Upsert(photo, token);
        if (!result.Success || result.Result == null)
        {
            return result.As<CosmosGame>();
        }

        model.Photos = model.Photos.Except(existingPhotosForUser).Concat(new[] {result.Result!}).ToList();

        return new ActionResult<CosmosGame>
        {
            Success = true,
            Messages =
            {
                "Photo added",
            },
            Result = model,
        };
    }
}