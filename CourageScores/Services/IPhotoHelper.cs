using CourageScores.Models;

namespace CourageScores.Services;

public interface IPhotoHelper
{
    Task<ActionResult<byte[]>> ResizePhoto(byte[] bytes, CancellationToken token);
}