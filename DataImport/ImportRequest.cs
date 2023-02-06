using CourageScores.Models.Cosmos;

namespace DataImport;

public class ImportRequest
{
    public Guid DivisionId { get; }
    public Guid SeasonId { get; }
    public string UserName { get; }

    public ImportRequest(Guid divisionId, Guid seasonId, string userName = "import")
    {
        DivisionId = divisionId;
        SeasonId = seasonId;
        UserName = userName;
    }

    public T Created<T>(T item)
        where T : AuditedEntity
    {
        item.Author = "import";
        item.Created = DateTime.UtcNow;
        item.Editor = "import";
        item.Updated = DateTime.UtcNow;
        return item;
    }
}