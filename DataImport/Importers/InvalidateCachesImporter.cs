using System.Net.Http.Headers;

namespace DataImport.Importers;

public class InvalidateCachesImporter : IImporter
{
    private static readonly string[] RelativeUrls =
    {
        "/api/Division/{divisionId}/Data",
        "/api/Division/{divisionId}/{seasonId}/Data",
        "/api/Team/{divisionId}/{seasonId}",
    };
    private readonly Settings _settings;
    private readonly TextWriter _log;
    private readonly HttpClient _httpClient;

    public InvalidateCachesImporter(Settings settings, TextWriter log)
    {
        _settings = settings;
        _log = log;
        _httpClient = new HttpClient
        {
            DefaultRequestHeaders =
            {
                CacheControl = new CacheControlHeaderValue
                {
                    NoCache = true,
                },
            },
        };
    }

    private string GetApiHostName(string cosmosHostUrl)
    {
        if (!string.IsNullOrEmpty(_settings.ApiHostName))
        {
            return _settings.ApiHostName;
        }

        var cosmosHost = new Uri(cosmosHostUrl).Host;
        var apiHost = cosmosHost.Substring(0, cosmosHost.IndexOf(".", StringComparison.Ordinal)) + ".azurewebsites.net";

        return apiHost;
    }

    public async Task<bool> RunImport(AccessDatabase source, CosmosDatabase destination, ImportContext context, CancellationToken token)
    {
        var apiHost = GetApiHostName(destination.HostName);

        foreach (var url in RelativeUrls)
        {
            if (token.IsCancellationRequested)
            {
                return true;
            }

            await SendRequest(apiHost, url, token);
        }

        foreach (var team in context.Teams!.GetModified())
        {
            if (token.IsCancellationRequested)
            {
                return true;
            }

            var teamRelativeUrl = $"/api/Team/{team.Value.Id}";
            await SendRequest(apiHost, teamRelativeUrl, token);
        }

        return true;
    }

    private async Task SendRequest(string apiHost, string relativeUrl, CancellationToken token)
    {
        var resolvedRelativeUrl = relativeUrl.Replace("{seasonId}", _settings.SeasonId.ToString())
            .Replace("{divisionId}", _settings.DivisionId.ToString());
        var absoluteUrl = new Uri($"https://{apiHost}/data{resolvedRelativeUrl}", UriKind.Absolute);

        var request = new HttpRequestMessage
        {
            RequestUri = absoluteUrl,
            Method = HttpMethod.Get,
        };

        if (_settings.Commit)
        {
            await _log.WriteLineAsync($"Sending no-cache request to {absoluteUrl}...");
            await _httpClient.SendAsync(request, token);
        }
        else
        {
            await _log.WriteLineAsync($"Skipping no-cache request to {absoluteUrl} [Commit = false]");
        }
    }
}