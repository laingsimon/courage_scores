namespace CourageScores.Models;

public static class NameExtensions
{
    public static string AddressOrName(this INameAndAddress item, string fallbackValue = "")
    {
        return (string.IsNullOrEmpty(item.Address?.Trim())
            ? item.Name?.Trim()
            : item.Address?.Trim()) ?? fallbackValue;
    }
}