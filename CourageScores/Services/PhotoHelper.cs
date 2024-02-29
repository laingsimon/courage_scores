using CourageScores.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace CourageScores.Services;

public class PhotoHelper : IPhotoHelper
{
    public Task<ActionResult<byte[]>> ResizePhoto(byte[] bytes, int maxHeight, CancellationToken token)
    {
        try
        {
            // ReSharper disable once ConvertToUsingDeclaration
            using (var image = Image.Load(new MemoryStream(bytes)))
            {
                if (image.Height <= maxHeight)
                {
                    return Task.FromResult(new ActionResult<byte[]>
                    {
                        Result = bytes,
                        Success = true,
                        Messages =
                        {
                            $"Photo size is {image.Width}x{image.Width}",
                        },
                    });
                }

                var requiredSize = RescaleSize(image.Size, maxHeight);
                var newBytes = ScaleImageToSize(image, requiredSize);

                return Task.FromResult(new ActionResult<byte[]>
                {
                    Result = newBytes,
                    Success = true,
                    Messages =
                    {
                        $"Photo resized from {image.Width}x{image.Height} to {requiredSize.Width}x{requiredSize.Height}"
                    },
                });
            }
        }
        catch (Exception exc)
        {
            return Task.FromResult(new ActionResult<byte[]>
            {
                Success = false,
                Warnings = { "Not a valid photo" },
                Errors =
                {
                    exc.Message,
                },
            });
        }
    }

    private static byte[] ScaleImageToSize(Image src, Size requiredSize)
    {
        var stream = new MemoryStream();

        src.Mutate(img => img.Resize(requiredSize));
        src.Save(stream, src.Metadata.DecodedImageFormat!);

        return stream.ToArray();
    }

    private static Size RescaleSize(Size currentSize, double maxHeight)
    {
        var rescale = maxHeight / currentSize.Height;
        return new Size((int)Math.Floor(currentSize.Width * rescale), (int)Math.Floor(currentSize.Height*rescale));
    }
}