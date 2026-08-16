using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using CourageScores.Binders;
using CourageScores.Filters;
using CourageScores.Formatters;
using Microsoft.AspNetCore.Authentication.Cookies;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace CourageScores;

[ExcludeFromCodeCoverage]
public class Bootstrap
{
    public const string LocalhostAddress = "https://localhost:44426";

    private readonly Action<WebApplicationBuilder> _customiseBuilder;

    public Bootstrap(Action<WebApplicationBuilder>? customiseBuilder = null)
    {
        _customiseBuilder = customiseBuilder ?? (_ => { });
    }

    public WebApplication SetupApp(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        var configuration = builder.Configuration;

        builder.Services
            .AddAuthentication(
                options => { options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme; })
            .AddCookie(options =>
            {
                options.LoginPath = "/api/Account/Login"; // Must be lowercase
            })
            .AddGoogle(options =>
            {
                options.ClientId = configuration["GoogleAuth_ClientId"]!;
                options.ClientSecret = configuration["GoogleAuth_Secret"]!;
            });

        // Add services to the container.
        builder.Services
            .AddControllersWithViews(options =>
            {
                options.Filters.Add<CacheManagementFilter>();
                options.Filters.Add<TelemetryFilter>();
                options.AddCommaSeparatedArrayModelBinderProvider();
                options.OutputFormatters.Add(new CalendarTextOutputFormatter());
            })
            .AddNewtonsoftJson(options =>
            {
                options.SerializerSettings.NullValueHandling = NullValueHandling.Ignore;
                options.SerializerSettings.DefaultValueHandling = DefaultValueHandling.Ignore;
                options.SerializerSettings.Converters.Add(new StringEnumConverter());
            });

        builder.Services.AddSwaggerGenNewtonsoftSupport();
        builder.Services.AddSwaggerGen(options =>
        {
            var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
            options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFilename));
        });

        var appInsightsIsConfigured = Environment.GetEnvironmentVariable("APPLICATIONINSIGHTS_CONNECTION_STRING");
        if (!string.IsNullOrEmpty(appInsightsIsConfigured))
        {
            builder.Services.AddApplicationInsightsTelemetry();
        }

        builder.Services.RegisterServices();

        _customiseBuilder(builder);

        var app = builder.Build();
        app.UseMiddleware<ResponseContentLengthTelemetryMiddleware>();

        // Configure the HTTP request pipeline.
        if (!app.Environment.IsDevelopment())
        {
            // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
            app.UseHsts();
        }

        var handler = new ExceptionHandler(app.Environment.IsDevelopment());
        app.UseExceptionHandler(exceptionHandlerApp => { exceptionHandlerApp.Run(handler.HandleException); });

        app.UseHttpsRedirection();
        app.UseStaticFiles();
        app.UseRouting();

        app.UseAuthentication();
        app.UseAuthorization();

        app.UseSwagger();
        app.UseSwaggerUI();

        app.UseCors(cors =>
        {
            cors.WithOrigins(LocalhostAddress);
            cors.AllowAnyMethod();
            cors.AllowAnyHeader();
            cors.AllowCredentials();
        });

        app.UseWebSockets(); // must be before UseEndPoints - see https://stackoverflow.com/a/74285430
        app.MapControllerRoute(
            "default",
            "{controller}/{action=Index}/{id?}");

        app.MapFallbackToFile("index.html");

        return app;
    }

    private class ResponseContentLengthTelemetryMiddleware(RequestDelegate next)
    {
        public async Task InvokeAsync(HttpContext context)
        {
            context.Response.OnStarting(() =>
            {
                var activity = Activity.Current;
                var contentLength = context.Response.ContentLength ?? -2;
                activity?.SetTag("http.response_content_length", contentLength);
                return Task.CompletedTask;
            });

            await next(context);
        }
    }
}
