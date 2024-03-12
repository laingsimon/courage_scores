using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using CourageScores.Services;
using Microsoft.AspNetCore.Mvc;
using TypeScriptMapper;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromTypeScript]
[ExcludeFromCodeCoverage]
public class PhotoController : Controller
{
    private readonly IPhotoService _photoService;
    private readonly IPhotoHelper _photoHelper;

    public PhotoController(IPhotoService photoService, IPhotoHelper photoHelper)
    {
        _photoService = photoService;
        _photoHelper = photoHelper;
    }

    [HttpGet("/api/Photo/{id}")]
    public async Task Get(Guid id, CancellationToken token)
    {
        await GetPhoto(id, null, token);
    }

    [HttpGet("/api/Photo/{id}/{height}")]
    public async Task GetScaled(Guid id, int height, CancellationToken token)
    {
        await GetPhoto(id, height, token);
    }

    private async Task GetPhoto(Guid id, int? height, CancellationToken token)
    {
        var photo = await _photoService.GetPhoto(id, token);
        if (photo == null)
        {
            Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        var ifModifiedSinceHeader = Request.Headers.IfModifiedSince.ToString();
        if (DateTime.TryParseExact(ifModifiedSinceHeader, "R", null, DateTimeStyles.None, out var ifModifiedSince) && ifModifiedSince <= photo.Updated)
        {
            // no change
            Response.StatusCode = StatusCodes.Status304NotModified;
            return;
        }

        Response.ContentType = photo.ContentType;
        Response.Headers.ContentDisposition = $"inline; filename=\"{photo.FileName}\"";
        Response.Headers.LastModified = photo.Updated.ToString("R");

        var bytes = photo.PhotoBytes;
        if (height != null)
        {
            var result = await _photoHelper.ResizePhoto(photo.PhotoBytes, height.Value, token);
            if (result.Success)
            {
                bytes = result.Result ?? photo.PhotoBytes;
            }
        }

        await Response.BodyWriter.WriteAsync(bytes, token);
    }
}