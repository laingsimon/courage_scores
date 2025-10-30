using System.Diagnostics.CodeAnalysis;
using Microsoft.Azure.Cosmos;
using Moq;

namespace CourageScores.StubCosmos.Api;

[ExcludeFromCodeCoverage]
public class StubContainerResponse(Mock<Container> container) : ContainerResponse
{
    public override Container Container => container.Object;
}
