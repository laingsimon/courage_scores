using AutoFixture;
using AutoFixture.AutoMoq;
using AutoFixture.Kernel;
using CourageScores.Filters;
using Moq;
using NUnit.Framework;

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
        return fixture.FreezeMock<T>(constructorArgs.ToArray());
    }

    public static Mock<T> FreezeMock<T>(this IFixture fixture, params object[] args)
        where T : class
    {
        var mock = new Mock<T>(args);
        fixture.Register(() => mock.Object);
        return mock;
    }

    public static IFixture WithCacheManagementFlags(this IFixture fixture, out ScopedCacheManagementFlags flags)
    {
        fixture.Register(() => new ScopedCacheManagementFlags());
        fixture.Freeze<ScopedCacheManagementFlags>();
        flags = fixture.Create<ScopedCacheManagementFlags>();
        Assert.That(fixture.Create<ScopedCacheManagementFlags>(), Is.SameAs(flags));
        return fixture;
    }
}
