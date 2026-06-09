using System.Collections;
using System.Diagnostics.CodeAnalysis;
using Microsoft.AspNetCore.Http;

namespace CourageScores.Tests.Services.Identity;

internal class MockRequestCookies : IRequestCookieCollection
{
    public Dictionary<string, string> Cookies { get; } = new();

    public IEnumerator<KeyValuePair<string, string>> GetEnumerator()
    {
        return Cookies.GetEnumerator();
    }

    IEnumerator IEnumerable.GetEnumerator()
    {
        return GetEnumerator();
    }

    public bool ContainsKey(string key)
    {
        return Cookies.ContainsKey(key);
    }

    public bool TryGetValue(string key, [NotNullWhen(true)] out string? value)
    {
        return Cookies.TryGetValue(key, out value);
    }

    public int Count => Cookies.Count;
    public ICollection<string> Keys => Cookies.Keys;

    public string this[string key] => Cookies[key];
}