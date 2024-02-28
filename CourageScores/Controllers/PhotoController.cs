using System.Diagnostics.CodeAnalysis;
using CourageScores.Services;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class PhotoController : Controller
{
    private readonly IPhotoService _photoService;

    public PhotoController(IPhotoService photoService)
    {
        _photoService = photoService;
    }

    [HttpGet("/api/Photo/{id}")]
    public async Task Get(Guid id, CancellationToken token)
    {
        var photo = await _photoService.GetPhoto(id, token);
        if (photo == null)
        {
            Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        Response.ContentType = photo.ContentType;
        Response.Headers.ContentDisposition = $"inline; filename=\"{photo.FileName}\"";
        await Response.BodyWriter.WriteAsync(photo.PhotoBytes, token);
    }
}