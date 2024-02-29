using CourageScores.Models;
using CourageScores.Models.Cosmos;
using CourageScores.Services.Identity;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Services.Command;

public class UploadPhotoCommand : IUpdateCommand<CosmosGame, CosmosGame>
{
    public const int MinFileSize = 1024;

    private readonly IUserService _userService;
    private readonly IPhotoService _photoService;

    private IFormFile? _photo;

    public UploadPhotoCommand(IUserService userService, IPhotoService photoService)
    {
        _userService = userService;
        _photoService = photoService;
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

        if (fileContent.Length < MinFileSize)
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

        var existingPhoto = model.Photos.FirstOrDefault(p => p.Author == user.Name);

        var photo = new Photo
        {
            Id = existingPhoto?.Id ?? Guid.NewGuid(),
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

        model.Photos.RemoveAll(p => p.Author == user.Name); // remove any existing photos uploaded for this user
        model.Photos.Add(result.Result!);

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