using Microsoft.Azure.Cosmos;
using Moq;

namespace CourageScores.Tests.Services.Data;

public class MockContainerResponse : ContainerResponse
{
    private readonly Mock<Container> _container;

    public MockContainerResponse(Mock<Container> container)
    {
        _container = container;
    }

    public override Container Container => _container.Object;
}