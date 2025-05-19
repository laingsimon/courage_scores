using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Analysis;

[ExcludeFromCodeCoverage]
public class NamedBreakdownDto : IEquatable<NamedBreakdownDto>
{
    public string Name { get; }
    public int Value { get; }

    public NamedBreakdownDto(string name, int value)
    {
        Name = name;
        Value = value;
    }

    public bool Equals(NamedBreakdownDto? other)
    {
        if (other is null) return false;
        if (ReferenceEquals(this, other)) return true;
        return Name == other.Name && Value == other.Value;
    }

    public override bool Equals(object? obj)
    {
        if (obj is null) return false;
        if (ReferenceEquals(this, obj)) return true;
        if (obj.GetType() != GetType()) return false;
        return Equals((NamedBreakdownDto) obj);
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(Name, Value);
    }
}