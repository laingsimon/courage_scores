namespace CourageScores.Models;

public static class NameExtensions
{
    public static string AddressOrName(this INameAndAddress item, string fallbackValue = "")
    {
        var address = item.Address.TrimOrDefault();
        var name = item.Name.TrimOrDefault(fallbackValue);

        return string.IsNullOrEmpty(address)
            ? name
            : address;
    }

    public static string TrimOrDefault(this string? value, string fallbackValue = "")
    {
        // within the dotnet code we can be fairly confident that `value` will never be null, however if a null value
        // is included in some json content then it could result in a never-null property being set to null, as such
        // we check for null before trying to trim the value
        return value?.Trim() ?? fallbackValue;
    }
}