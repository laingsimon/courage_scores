using CourageScores.Services.Error;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Routing;
using Moq;
using Newtonsoft.Json;
using NUnit.Framework;

namespace CourageScores.Tests;

[TestFixture]
public class ExceptionHandlerTests
{
    private static readonly Exception Exception = GetException("some error");
    private static readonly IExceptionHandlerPathFeature ExceptionHandlerFeature = new ExceptionHandlerFeature
    {
        Error = Exception,
        Path = "some/path",
        RouteValues = new RouteValueDictionary
        {
            {
                "controller", "TestController"
            },
            {
                "action", "TestAction"
            },
        },
    };

    private HttpContext _context = null!;
    private Mock<IErrorDetailService> _errorDetailService = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _context = new DefaultHttpContext
        {
            Request =
            {
                Method = "POST",
                ContentLength = 10,
                Body = new MemoryStream(new byte[]
                {
                    0,
                    1,
                    2,
                    3,
                    4,
                    5,
                    6,
                    7,
                    8,
                    9,
                }),
                ContentType = "application/json",
                Path = new PathString("/path"),
                QueryString = new QueryString("?query"),
                Host = new HostString("host"),
                Scheme = "https",
                IsHttps = true,
            },
            Response =
            {
                Body = new MemoryStream(),
            },
        };
        var serviceProvider = new Mock<IServiceProvider>();
        _errorDetailService = new Mock<IErrorDetailService>();

        var requestServicesFeature = new Mock<IServiceProvidersFeature>();
        requestServicesFeature.Setup(f => f.RequestServices).Returns(serviceProvider.Object);
        serviceProvider.Setup(p => p.GetService(typeof(IErrorDetailService))).Returns(_errorDetailService.Object);

        _context.Features.Set(requestServicesFeature.Object);
        _context.Features.Set(ExceptionHandlerFeature);
    }

    [Test]
    public async Task HandleException_WhenCalled_SetsStatusCodeAndContentTypeCorrectly()
    {
        var exceptionHandler = new ExceptionHandler(true, "debug token");

        await exceptionHandler.HandleException(_context);

        Assert.That(_context.Response.StatusCode, Is.EqualTo(500));
        Assert.That(_context.Response.ContentType, Is.EqualTo("application/json; charset=utf-8"));
    }

    [Test]
    public async Task HandleException_WhenAllDetailsCanBeExposed_SetsContentCorrectly()
    {
        var exceptionHandler = new ExceptionHandler(true, "debug token");

        await exceptionHandler.HandleException(_context);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        var content = await new StreamReader(_context.Response.Body).ReadToEndAsync();
        var details = JsonConvert.DeserializeObject<ExceptionHandler.ErrorDetails>(content);
        Assert.That(details.Exception, Is.Not.Null);
        Assert.That(details.Exception!.Type, Is.EqualTo("InvalidOperationException"));
        Assert.That(details.Exception!.Message, Is.EqualTo(Exception.Message));
        Assert.That(details.Exception!.StackTrace, Is.Not.Null);
        Assert.That(details.RequestTimeUtc, Is.Not.Null);
        Assert.That(details.Request, Is.Not.Null);
        Assert.That(details.Request.Url, Is.EqualTo("https://host/path?query"));
        Assert.That(details.Request.Method, Is.EqualTo("POST"));
        Assert.That(details.Request.ContentLength, Is.EqualTo(10));
        Assert.That(details.Request.ContentType, Is.EqualTo("application/json"));
        Assert.That(details.Request.Controller, Is.EqualTo("TestController"));
        Assert.That(details.Request.Action, Is.EqualTo("TestAction"));
    }

    [Test]
    public async Task HandleException_WhenErrorDetailsShouldNotBeIncludedAndNoDebugToken_ExcludesMessageAndStack()
    {
        var exceptionHandler = new ExceptionHandler(false, "debug token");

        await exceptionHandler.HandleException(_context);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        var content = await new StreamReader(_context.Response.Body).ReadToEndAsync();
        var details = JsonConvert.DeserializeObject<ExceptionHandler.ErrorDetails>(content);
        Assert.That(details.Exception, Is.Not.Null);
        Assert.That(details.Exception!.Type, Is.EqualTo("InvalidOperationException"));
        Assert.That(details.Exception!.Message, Is.Null);
        Assert.That(details.Exception!.StackTrace, Is.Null);
    }

    [Test]
    public async Task HandleException_WhenErrorDetailsShouldNotBeIncludedAndIncorrectDebugToken_ExcludesMessageAndStack()
    {
        var exceptionHandler = new ExceptionHandler(false, "debug token");
        _context.Request.QueryString = new QueryString("?debugToken=foo");

        await exceptionHandler.HandleException(_context);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        var content = await new StreamReader(_context.Response.Body).ReadToEndAsync();
        var details = JsonConvert.DeserializeObject<ExceptionHandler.ErrorDetails>(content);
        Assert.That(details.Exception, Is.Not.Null);
        Assert.That(details.Exception!.Type, Is.EqualTo("InvalidOperationException"));
        Assert.That(details.Exception!.Message, Is.Null);
        Assert.That(details.Exception!.StackTrace, Is.Null);
    }

    [Test]
    public async Task HandleException_WhenErrorDetailsShouldNotBeIncludedAndEmptyDebugToken_ExcludesMessageAndStack()
    {
        var exceptionHandler = new ExceptionHandler(false, "debug token");
        _context.Request.QueryString = new QueryString("?debugToken");

        await exceptionHandler.HandleException(_context);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        var content = await new StreamReader(_context.Response.Body).ReadToEndAsync();
        var details = JsonConvert.DeserializeObject<ExceptionHandler.ErrorDetails>(content);
        Assert.That(details.Exception, Is.Not.Null);
        Assert.That(details.Exception!.Type, Is.EqualTo("InvalidOperationException"));
        Assert.That(details.Exception!.Message, Is.Null);
        Assert.That(details.Exception!.StackTrace, Is.Null);
    }

    [Test]
    public async Task HandleException_WhenDebugTokenNotConfigured_ExcludesMessageAndStack()
    {
        var exceptionHandler = new ExceptionHandler(false, "");
        _context.Request.QueryString = new QueryString("?debugToken=");

        await exceptionHandler.HandleException(_context);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        var content = await new StreamReader(_context.Response.Body).ReadToEndAsync();
        var details = JsonConvert.DeserializeObject<ExceptionHandler.ErrorDetails>(content);
        Assert.That(details.Exception, Is.Not.Null);
        Assert.That(details.Exception!.Type, Is.EqualTo("InvalidOperationException"));
        Assert.That(details.Exception!.Message, Is.Null);
        Assert.That(details.Exception!.StackTrace, Is.Null);
    }

    [TestCase("debug token")]
    [TestCase("DEBUG TOKEN")]
    public async Task HandleException_WhenErrorDetailsShouldNotBeIncludedAndCorrectDebugToken_IncludesMessageAndStack(string requestToken)
    {
        var exceptionHandler = new ExceptionHandler(false, "debug token");
        _context.Request.QueryString = new QueryString("?debugToken=" + requestToken);

        await exceptionHandler.HandleException(_context);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        var content = await new StreamReader(_context.Response.Body).ReadToEndAsync();
        var details = JsonConvert.DeserializeObject<ExceptionHandler.ErrorDetails>(content);
        Assert.That(details.Exception, Is.Not.Null);
        Assert.That(details.Exception!.Type, Is.EqualTo("InvalidOperationException"));
        Assert.That(details.Exception!.Message, Is.EqualTo(Exception.Message));
        Assert.That(details.Exception!.StackTrace, Is.Not.Null);
    }

    private static Exception GetException(string message)
    {
        try
        {
            throw new InvalidOperationException(message);
        }
        catch (Exception exc)
        {
            return exc;
        }
    }
}