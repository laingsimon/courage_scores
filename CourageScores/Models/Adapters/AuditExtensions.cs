using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Models.Adapters;

public static class AuditExtensions
{
    public static TDto AddAuditProperties<TModel, TDto>(this TDto dto, TModel model)
        where TModel: AuditedEntity
        where TDto: AuditedDto
    {
        dto.Author = model.Author;
        dto.Created = model.Created;
        dto.Editor = model.Editor;
        dto.Updated = model.Updated;
        dto.Deleted = model.Deleted;
        dto.Remover = model.Remover;
        return dto;
    }

    public static TModel AddAuditProperties<TModel, TDto>(this TModel model, TDto dto)
        where TModel: AuditedEntity
        where TDto: AuditedDto
    {
        model.Author = dto.Author;
        model.Created = dto.Created;
        model.Editor = dto.Editor;
        model.Updated = dto.Updated;
        model.Deleted = dto.Deleted;
        model.Remover = dto.Remover;
        return model;
    }
}