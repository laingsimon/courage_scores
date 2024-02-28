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

    public PhotoService(IUserService userService, IPhotoRepository photoRepository, IPhotoHelper photoHelper, ISystemClock clock)
    {
        _userService = userService;
        _photoRepository = photoRepository;
        _photoHelper = photoHelper;
        _clock = clock;
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

        var resizedPhoto = await _photoHelper.ResizePhoto(photo.PhotoBytes, token);
        if (!resizedPhoto.Success || resizedPhoto.Result == null)
        {
            return resizedPhoto.As<PhotoReference>();
        }

        await _photoRepository.Upsert(photo.Id, resizedPhoto.Result!, token);
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

    public async Task<byte[]?> GetPhoto(Guid id, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user?.Access?.ManageScores != true)
        {
            return null;
        }

        return await _photoRepository.GetPhoto(id, token);
    }
}