using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using CourageScores;
using CourageScores.Binders;
using CourageScores.Filters;
using Microsoft.AspNetCore.Authentication.Cookies;
using Newtonsoft.Json.Converters;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;

builder.Services
    .AddAuthentication(options => { options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme; })
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
        options.AddCommaSeparatedArrayModelBinderProvider();
    })
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.Converters.Add(new StringEnumConverter());
    });

builder.Services.AddSwaggerGenNewtonsoftSupport();
builder.Services.AddSwaggerGen(options =>
{
    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFilename));
});

builder.Services.RegisterServices();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
{
    app.UseHsts();
}

var debugToken = configuration["DebugToken"];
var handler = new ExceptionHandler(app.Environment.IsDevelopment(), debugToken);
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
    cors.WithOrigins("https://localhost:44426");
    cors.AllowAnyMethod();
    cors.AllowAnyHeader();
    cors.AllowCredentials();
});

app.UseWebSockets(); // must be before UseEndPoints - see https://stackoverflow.com/a/74285430
app.MapControllerRoute(
    "default",
    "{controller}/{action=Index}/{id?}");

app.MapFallbackToFile("index.html");

app.Run();

[ExcludeFromCodeCoverage]
public partial class Program
{
}
