using Microsoft.Azure.Cosmos;
using Moq;

namespace CourageScores.Sandbox.Cosmos.Api;

public class MockContainerResponse : ContainerResponse
{
    private readonly Mock<Container> _container;

    public MockContainerResponse(Mock<Container> container)
    {
        _container = container;
    }

    public override Container Container => _container.Object;
}
