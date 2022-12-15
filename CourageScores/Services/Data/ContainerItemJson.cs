using Newtonsoft.Json;

namespace CourageScores.Services.Data;

public class ContainerItemJson
{
    private static readonly JsonSerializer Serialiser = new JsonSerializer();

    public static ContainerItemJson ReadContainerStream(Stream stream)
    {
        using (var streamReader = new JsonTextReader(new StreamReader(stream)))
        {
            return Serialiser.Deserialize<ContainerItemJson>(streamReader);
        }
    }

    public List<DocumentCollection> DocumentCollections { get; set; } = new();

    // ReSharper disable once ClassNeverInstantiated.Local
    public class DocumentCollection
    {
        public string Id { get; set; } = null!;
        public PartitionKeyPaths PartitionKey { get; set; } = null!;
    }

    // ReSharper disable once ClassNeverInstantiated.Local
    public class PartitionKeyPaths
    {
        public List<string> Paths { get; set; } = new();
    }
}