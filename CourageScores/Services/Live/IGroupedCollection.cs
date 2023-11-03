namespace CourageScores.Services.Live;

public interface IGroupedCollection<T> : IReadOnlyCollection<T>
    where T: class
{
    void Add(Guid key, T item);
    void Remove(Guid key, T item);
    IReadOnlyCollection<T> GetItems(Guid key);
}