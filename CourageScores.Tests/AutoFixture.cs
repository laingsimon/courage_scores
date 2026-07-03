using AutoFixture;
using AutoFixture.AutoMoq;
using AutoFixture.Kernel;
using CourageScores.Filters;
using Moq;

namespace CourageScores.Tests;

public static class AutoFixture
{
    public static IFixture Create()
    {
        var fixture = new Fixture();
        fixture.Customize(new AutoMoqCustomization { ConfigureMembers = true });
        return fixture;
    }

    public static Mock<T> FreezeMockOf<T>(this IFixture fixture)
        where T : class
    {
        var context = new SpecimenContext(fixture);
        var constructorArgs = typeof(T).GetConstructors()
            .Single() // there must be only one constructor
            .GetParameters()
            .Select(p => fixture.Create(p.ParameterType, context));

        var mock = new Mock<T>(constructorArgs.ToArray());
        fixture.Register(() => mock.Object);
        return mock;
    }

    public static Mock<T> FreezeMock<T>(this IFixture fixture)
        where T : class
    {
        var mock = new Mock<T>();
        fixture.Register(() => mock.Object);
        return mock;
    }

    public static IFixture WithCacheManagementFlags(this IFixture fixture, out ScopedCacheManagementFlags flags)
    {
        var f = new ScopedCacheManagementFlags();
        flags = f;
        fixture.Register(() => f);
        return fixture;
    }
}
