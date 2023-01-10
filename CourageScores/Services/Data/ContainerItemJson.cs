using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace CourageScores.Services.Data;

[SuppressMessage("ReSharper", "ClassNeverInstantiated.Global")]
[SuppressMessage("ReSharper", "CollectionNeverUpdated.Global")]
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

    public class DocumentCollection
    {
        public string Id { get; set; } = null!;
        public PartitionKeyPaths PartitionKey { get; set; } = null!;
    }

    public class PartitionKeyPaths
    {
        public List<string> Paths { get; set; } = new();
    }
}