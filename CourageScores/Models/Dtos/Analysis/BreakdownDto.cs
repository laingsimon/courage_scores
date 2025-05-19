namespace CourageScores.Models.Dtos.Analysis;

public class BreakdownDto<T> : Dictionary<string, T[]>, IBreakdownDto
{
    public BreakdownDto(IEnumerable<KeyValuePair<string, T[]>> source)
        :base(source)
    { }
}