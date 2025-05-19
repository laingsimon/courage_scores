namespace CourageScores.Models.Dtos.Analysis;

public class NumericBreakdownDto : IEquatable<NumericBreakdownDto>
{
    public int Value { get; }
    public int Number { get; }

    public NumericBreakdownDto(int value, int number)
    {
        Value = value;
        Number = number;
    }

    public bool Equals(NumericBreakdownDto? other)
    {
        if (other is null) return false;
        if (ReferenceEquals(this, other)) return true;
        return Value == other.Value && Number == other.Number;
    }

    public override bool Equals(object? obj)
    {
        if (obj is null) return false;
        if (ReferenceEquals(this, obj)) return true;
        if (obj.GetType() != GetType()) return false;
        return Equals((NumericBreakdownDto) obj);
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(Value, Number);
    }
}