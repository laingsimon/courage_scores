using CourageScores.Repository;
using CourageScores.Sandbox.Auth;
using CourageScores.Sandbox.Cosmos.Api;
using CourageScores.Sandbox.Cosmos.BlobStorage;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.BehaviouralTests.Framework;

internal sealed class App
{
    private readonly WebApplication _app;

    private App(WebApplication app, AppAccessor appAccessor)
    {
        _app = app;
        appAccessor.App = this;
    }

    public static Task<App> CreateTestApp()
    {
        var appAccessor = new AppAccessor();
        var bootstrap = new Bootstrap(builder => CustomiseBuilder(builder, appAccessor));
        var app = new App(bootstrap.SetupApp([]), appAccessor);
        return Task.FromResult(app);
    }

    public async Task Run()
    {
        await _app.StartAsync();
    }

    public async Task Stop(TimeSpan timeout)
    {
        await _app.StopAsync(timeout);
    }

    public Task<ScopedController<TController>> ResolveController<TController>()
        where TController: ControllerBase
    {
        var scope = _app.Services.CreateScope();

        var factory = scope.ServiceProvider.GetRequiredService<ControllerFactory<TController>>();
        var httpContext = scope.ServiceProvider.GetRequiredService<HttpContext>();
        var contextAccessor = scope.ServiceProvider.GetRequiredService<IHttpContextAccessor>();
        contextAccessor.HttpContext = httpContext;
        httpContext.RequestServices = scope.ServiceProvider;

        return Task.FromResult(new ScopedController<TController>(factory.GetController(), scope));
    }

    private static void CustomiseBuilder(WebApplicationBuilder builder, AppAccessor appAccessor)
    {
        builder.Services.AddSingleton<IBlobStorageRepository>(new TestBlobStorageRepository());
        builder.Services.AddSingleton<ICosmosDatabaseFactory, TestCosmosDatabaseFactory>();
        builder.Services.AddSingleton(appAccessor);
        builder.Services.AddSingleton<App>(p => p.GetRequiredService<AppAccessor>().App!);
        builder.Services.AddScoped<HttpContext>(_ => new DefaultHttpContext());
        builder.Services.AddScoped<ControllerContext>(x => new ControllerContext
        {
            HttpContext = x.GetRequiredService<HttpContext>(),
        });
        builder.Services.AddScoped(typeof(ControllerFactory<>));
        builder.Services.AddScoped<IAuthenticationService, TestAuthenticationService>();

        var controllers = typeof(Bootstrap).Assembly.GetTypes().Where(t => t.IsAssignableTo(typeof(ControllerBase)));
        foreach (var controller in controllers)
        {
            builder.Services.AddScoped(controller);
        }
    }

    private class AppAccessor
    {
        public App? App { get; internal set; }
    }

    private class ControllerFactory<T>(T controller, ControllerContext context) where T : ControllerBase
    {
        public T GetController()
        {
            controller.ControllerContext = context;
            return controller;
        }
    }

    public class ScopedController<T>(T controller, IDisposable scope) : IDisposable
    {
        public T Controller { get; } = controller;

        public void Dispose()
        {
            scope.Dispose();
        }
    }
}
