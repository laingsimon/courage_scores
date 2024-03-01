using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Models.Adapters;

public class PhotoReferenceAdapter : ISimpleAdapter<PhotoReference, PhotoReferenceDto>
{
    public Task<PhotoReferenceDto> Adapt(PhotoReference model, CancellationToken token)
    {
        return Task.FromResult(new PhotoReferenceDto
        {
            Author = model.Author,
            ContentType = model.ContentType,
            FileName = model.FileName,
            Created = model.Created,
            FileSize = model.FileSize,
            Id = model.Id,
        });
    }

    public Task<PhotoReference> Adapt(PhotoReferenceDto dto, CancellationToken token)
    {
        return Task.FromResult(new PhotoReference
        {
            Author = dto.Author,
            ContentType = dto.ContentType,
            FileName = dto.FileName,
            Created = dto.Created,
            FileSize = dto.FileSize,
            Id = dto.Id,
        });
    }
}