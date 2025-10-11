﻿using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Common.Cosmos;

[SuppressMessage("ReSharper", "ClassNeverInstantiated.Global")]
[SuppressMessage("ReSharper", "CollectionNeverUpdated.Global")]
[ExcludeFromCodeCoverage]
public class ContainerItemJson
{
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
