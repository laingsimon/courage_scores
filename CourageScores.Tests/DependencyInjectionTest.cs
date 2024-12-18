using CourageScores.Repository;
using CourageScores.Services.Command;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests;

[TestFixture]
public class DependencyInjectionTest
{
    private ServiceProvider _serviceProvider = null!;

    [OneTimeSetUp]
    public void SetupOnce()
    {
        var configuration = new ConfigurationManager();
        configuration["CosmosDb_DatabaseName"] = "test_db";
        configuration["CosmosDb_Endpoint"] = "url";
        configuration["CosmosDb_Key"] = "key";
        configuration["BlobStorage_AccountName"] = "account";
        configuration["BlobStorage_Key"] = "key";

        IServiceCollection services = new ServiceCollection();
        foreach (var controller in Controllers())
        {
            services.AddScoped(controller);
        }
        services.RegisterServices();
        services.AddScoped<ICosmosDatabaseFactory, MockCosmosDatabaseFactory>();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddSingleton(new Mock<IBlobStorageRepository>().Object);

        _serviceProvider = services.BuildServiceProvider();
    }

    [TestCaseSource(nameof(Controllers))]
    public void ControllersCanBeCreated(Type type)
    {
        var service = _serviceProvider.GetRequiredService(type);

        Assert.That(service, Is.Not.Null);
    }

    [TestCaseSource(nameof(Commands))]
    public void CommandsCanBeCreated(Type type)
    {
        var service = _serviceProvider.GetRequiredService(type);

        Assert.That(service, Is.Not.Null);
    }

    private static IEnumerable<Type> Controllers()
    {
        var types = typeof(DependencyInjectionExtensions).Assembly.GetTypes();
        var controllers = types.Where(t => t.IsAssignableTo(typeof(Controller)));

        return controllers;
    }

    private static IEnumerable<Type> Commands()
    {
        var types = typeof(DependencyInjectionExtensions).Assembly.GetTypes();
        var commands = types.Where(t => t.IsAssignableTo(typeof(IUpdateCommand)));

        return commands
            .Where(t => t.IsClass && !t.IsAbstract)
            .Select(t =>
            {
                if (!t.IsGenericTypeDefinition)
                {
                    return t;
                }

                var genericArguments = t.GetGenericArguments().Select(gta => gta.GetGenericParameterConstraints().First()).ToArray();
                return t.MakeGenericType(genericArguments);
            });
    }

    private class MockCosmosDatabaseFactory : ICosmosDatabaseFactory
    {
        public Task<Database> CreateDatabase()
        {
            return Task.FromResult(new Mock<Database>
            {
                DefaultValue = DefaultValue.Mock,
            }.Object);
        }
    }
}