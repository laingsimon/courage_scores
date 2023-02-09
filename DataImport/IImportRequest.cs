using CourageScores.Models.Cosmos;

namespace DataImport;

public interface IImportRequest
{
    public Guid DivisionId { get; }
    public Guid SeasonId { get; }
    public string UserName { get; }

    public T Created<T>(T item)
        where T : AuditedEntity
    {
        item.Author = UserName;
        item.Created = DateTime.UtcNow;
        item.Editor = UserName;
        item.Updated = DateTime.UtcNow;
        return item;
    }
}