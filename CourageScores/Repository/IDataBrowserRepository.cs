namespace CourageScores.Repository;

public interface IDataBrowserRepository<T>
{
    IAsyncEnumerable<T> GetAll(string tableName, CancellationToken token);
    Task<T?> GetItem(string tableName, Guid id, CancellationToken token);
    Task<bool> TableExists(string tableName, CancellationToken token);
}