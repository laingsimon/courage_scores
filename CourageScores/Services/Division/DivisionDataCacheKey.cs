using CourageScores.Models.Dtos.Division;

namespace CourageScores.Services.Division;

public class DivisionDataCacheKey : IEquatable<DivisionDataCacheKey>
{
    // ReSharper disable once UnusedMember.Local
    private readonly DateTime _created = DateTime.UtcNow;

    public DivisionDataCacheKey(DivisionDataFilter filter, string type)
    {
        Filter = filter;
        Type = type;
    }

    public DivisionDataFilter Filter { get; }
    public string Type { get; }

    public bool Equals(DivisionDataCacheKey? other)
    {
        if (other == null)
        {
            return false;
        }
        if (ReferenceEquals(this, other))
        {
            return true;
        }
        return Filter.Equals(other.Filter) && Type == other.Type;
    }

    public override bool Equals(object? obj)
    {
        return Equals(obj as DivisionDataCacheKey);
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(Filter, Type);
    }
}