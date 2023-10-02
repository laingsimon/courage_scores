namespace CourageScores.Services.Game;

public abstract class BaseOrderUnimportantComparer<T> : IEqualityComparer<T>, IEqualityComparer<ICollection<T>>
{
    public bool Equals(ICollection<T>? x, ICollection<T>? y)
    {
        if (x == null && y == null)
        {
            return true;
        }

        if (x == null || y == null)
        {
            return false;
        }

        var setX = new HashSet<T>(x, this);
        var setY = new HashSet<T>(y, this);
        return setX.SetEquals(setY);
    }

    public int GetHashCode(ICollection<T> obj)
    {
        return obj.Count;
    }

    bool IEqualityComparer<T>.Equals(T? x, T? y)
    {
        if (x == null && y == null)
        {
            return true;
        }

        return Equals(x!, y!);
    }

    public abstract bool Equals(T x, T y);
    public abstract int GetHashCode(T obj);
}