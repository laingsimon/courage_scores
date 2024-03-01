using CourageScores.Models;
using CourageScores.Models.Cosmos;

namespace CourageScores.Services.Command;

public class DeletePhotoCommand<T> : IUpdateCommand<T, T>
    where T : IPhotoEntity
{
    private readonly IPhotoService _photoService;

    private Guid? _photoId;

    public DeletePhotoCommand(IPhotoService photoService)
    {
        _photoService = photoService;
    }

    public DeletePhotoCommand<T> WithId(Guid photoId)
    {
        _photoId = photoId;
        return this;
    }

    public async Task<ActionResult<T>> ApplyUpdate(T model, CancellationToken token)
    {
        _photoId.ThrowIfNull($"{nameof(WithId)} must be called first");

        var result = await _photoService.Delete(_photoId!.Value, token);
        if (!result.Success)
        {
            return result.As<T>();
        }

        model.Photos = model.Photos.Where(p => p.Id != _photoId.Value).ToList();
        return new ActionResult<T>
        {
            Success = true,
            Messages =
            {
                "Photo deleted",
            },
        };
    }
}