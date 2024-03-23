using CourageScores.Models;
using CourageScores.Models.Cosmos;
using CourageScores.Repository;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services;

public class PhotoService : IPhotoService
{
    private readonly IUserService _userService;
    private readonly IPhotoRepository _photoRepository;
    private readonly IPhotoHelper _photoHelper;
    private readonly ISystemClock _clock;
    private readonly IPhotoSettings _settings;

    public PhotoService(IUserService userService, IPhotoRepository photoRepository, IPhotoHelper photoHelper, ISystemClock clock, IPhotoSettings settings)
    {
        _userService = userService;
        _photoRepository = photoRepository;
        _photoHelper = photoHelper;
        _clock = clock;
        _settings = settings;
    }

    public async Task<ActionResult<PhotoReference>> Upsert(Photo photo, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user?.Access?.UploadPhotos != true)
        {
            return new ActionResult<PhotoReference>
            {
                Success = false,
                Warnings =
                {
                    "Not permitted",
                },
            };
        }

        var resizedPhoto = await _photoHelper.ResizePhoto(photo.PhotoBytes, _settings.MaxPhotoHeight, token);
        if (!resizedPhoto.Success || resizedPhoto.Result == null)
        {
            return resizedPhoto.As<PhotoReference>();
        }

        photo.Author = photo.Created == default
            ? user.Name
            : photo.Author;
        photo.Created = photo.Created == default
            ? _clock.UtcNow.UtcDateTime
            : photo.Created;
        photo.Editor = user.Name;
        photo.Updated = _clock.UtcNow.UtcDateTime;
        photo.PhotoBytes = resizedPhoto.Result;

        await _photoRepository.Upsert(photo, token);
        return new ActionResult<PhotoReference>
        {
            Success = true,
            Result = new PhotoReference
            {
                Id = photo.Id,
                Author = user.Name,
                Created = _clock.UtcNow,
                FileSize = resizedPhoto.Result.Length,
                ContentType = photo.ContentType,
                FileName = photo.FileName,
            }
        };
    }

    public async Task<Photo?> GetPhoto(Guid id, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        var canViewAllPhotos = user?.Access?.ViewAnyPhoto == true;
        var canViewOwnPhoto = user?.Access?.UploadPhotos == true;

        if (!canViewAllPhotos && !canViewOwnPhoto)
        {
            return null;
        }

        var photo = await _photoRepository.Get(id, token);
        if (photo == null)
        {
            return null;
        }

        return canViewAllPhotos || photo.Author == user!.Name
            ? photo
            : null;
    }

    public async Task<ActionResult<Photo>> Delete(Guid id, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        var canDeleteAnyPhoto = user?.Access?.DeleteAnyPhoto == true;
        var canDeleteOwnPhoto = user?.Access?.UploadPhotos == true;

        if (!canDeleteOwnPhoto && !canDeleteAnyPhoto)
        {
            return new ActionResult<Photo>
            {
                Success = false,
                Warnings =
                {
                    "Not permitted",
                },
            };
        }

        var currentPhoto = await _photoRepository.Get(id, token);
        if (currentPhoto == null)
        {
            return new ActionResult<Photo>
            {
                Success = false,
                Warnings =
                {
                    "Not found",
                },
            };
        }

        var canDelete = canDeleteAnyPhoto || canDeleteOwnPhoto && currentPhoto.Author == user!.Name;
        if (!canDelete)
        {
            return new ActionResult<Photo>
            {
                Success = false,
                Warnings =
                {
                    "You can only delete your own photos",
                },
            };
        }

        currentPhoto.Deleted = _clock.UtcNow.UtcDateTime;
        currentPhoto.Remover = user!.Name;
        await _photoRepository.Upsert(currentPhoto, token);

        return new ActionResult<Photo>
        {
            Success = true,
            Result = currentPhoto,
            Messages =
            {
                "Photo deleted",
            }
        };
    }
}