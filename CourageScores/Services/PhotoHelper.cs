using System.Diagnostics.CodeAnalysis;
using System.Drawing;
using CourageScores.Models;

namespace CourageScores.Services;

[SuppressMessage("ReSharper", "ConvertToUsingDeclaration")]
public class PhotoHelper : IPhotoHelper
{
    public const int MaxHeight = 1_000; // pixels

    public Task<ActionResult<byte[]>> ResizePhoto(byte[] bytes, CancellationToken token)
    {
        try
        {
            using (var image = Image.FromStream(new MemoryStream(bytes)))
            {
                var size = image.Size;
                if (size.Height <= MaxHeight)
                {
                    return Task.FromResult(new ActionResult<byte[]>
                    {
                        Result = bytes,
                        Success = true,
                        Messages =
                        {
                            $"Photo size is {size.Width}x{size.Width}",
                        },
                    });
                }

                var requiredSize = RescaleSize(size, MaxHeight);
                var newBytes = ScaleImageToSize(image, requiredSize);

                return Task.FromResult(new ActionResult<byte[]>
                {
                    Result = newBytes,
                    Success = true,
                    Messages =
                    {
                        $"Photo resized from {size.Width}x{size.Height} to {requiredSize.Width}x{requiredSize.Height}"
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
        using (var dest = new Bitmap(requiredSize.Width, requiredSize.Height))
        using (var graphics = Graphics.FromImage(dest))
        {
            graphics.DrawImage(src, 0, 0, requiredSize.Width, requiredSize.Height);

            graphics.Save();

            var stream = new MemoryStream();
            dest.Save(stream, src.RawFormat);

            return stream.ToArray();
        }
    }

    private static Size RescaleSize(Size currentSize, double maxHeight)
    {
        var rescale = maxHeight / currentSize.Height;
        return new Size((int)Math.Floor(currentSize.Width * rescale), (int)Math.Floor(currentSize.Height*rescale));
    }
}