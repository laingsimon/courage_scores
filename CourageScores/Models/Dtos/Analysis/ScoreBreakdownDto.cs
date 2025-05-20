using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Analysis;

[ExcludeFromCodeCoverage]
public class ScoreBreakdownDto : IEquatable<ScoreBreakdownDto>
{
    public int Score { get; }
    public int Number { get; }

    public ScoreBreakdownDto(int score, int number)
    {
        Score = score;
        Number = number;
    }

    public bool Equals(ScoreBreakdownDto? other)
    {
        if (other is null) return false;
        if (ReferenceEquals(this, other)) return true;
        return Score == other.Score && Number == other.Number;
    }

    public override bool Equals(object? obj)
    {
        if (obj is null) return false;
        if (ReferenceEquals(this, obj)) return true;
        if (obj.GetType() != GetType()) return false;
        return Equals((ScoreBreakdownDto) obj);
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(Score, Number);
    }
}
