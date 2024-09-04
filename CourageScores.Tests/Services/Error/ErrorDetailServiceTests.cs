using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Error;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Diagnostics;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Error;

[TestFixture]
public class ErrorDetailServiceTests
{
    private readonly CancellationToken _token = new();
    private ErrorDetailService _service = null!;
    private Mock<IGenericDataService<ErrorDetail, ErrorDetailDto>> _genericService = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<ICommandFactory> _commandFactory = null!;
    private Mock<IErrorDetailAdapter> _errorDetailAdapter = null!;
    private Mock<AddErrorCommand> _addErrorCommand = null!;
    private UserDto? _user;
    private ErrorDetail _error = null!;
    private ErrorDetailDto _errorDto = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _user = _user.SetAccess(viewExceptions: true);
        _error = new ErrorDetail
        {
            Id = Guid.NewGuid(),
        };
        _errorDto = new ErrorDetailDto
        {
            Id = _error.Id,
        };
        _genericService = new Mock<IGenericDataService<ErrorDetail, ErrorDetailDto>>();
        _userService = new Mock<IUserService>();
        _commandFactory = new Mock<ICommandFactory>();
        _errorDetailAdapter = new Mock<IErrorDetailAdapter>();
        _addErrorCommand = new Mock<AddErrorCommand>(_userService.Object);
        _service = new ErrorDetailService(
            _genericService.Object,
            _userService.Object,
            _commandFactory.Object,
            _errorDetailAdapter.Object);

        _genericService.Setup(s => s.Get(_error.Id, _token)).ReturnsAsync(_errorDto);
        _genericService
            .Setup(s => s.GetWhere(It.IsAny<string>(), _token))
            .Returns(TestUtilities.AsyncEnumerable(_errorDto));
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _commandFactory.Setup(f => f.GetCommand<AddErrorCommand>()).Returns(_addErrorCommand.Object);
    }

    [Test]
    public async Task Get_WhenNotLoggedIn_ReturnsNull()
    {
        _user = null;

        var result = await _service.Get(_error.Id, _token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task Get_WhenNotPermitted_ReturnsNull()
    {
        _user!.Access!.ViewExceptions = false;

        var result = await _service.Get(_error.Id, _token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task Get_WhenPermitted_ReturnsErrorDetail()
    {
        var result = await _service.Get(_error.Id, _token);

        Assert.That(result, Is.EqualTo(_errorDto));
    }

    [Test]
    public async Task GetSince_WhenNotLoggedIn_ReturnsEmpty()
    {
        _user = null;

        var result = await _service.GetSince(new DateTime(2001, 02, 03), _token).ToList();

        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetSince_WhenNotPermitted_ReturnsEmpty()
    {
        _user!.Access!.ViewExceptions = false;

        var result = await _service.GetSince(new DateTime(2001, 02, 03), _token).ToList();

        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetSince_WhenPermitted_ReturnsErrorDetails()
    {
        var result = await _service.GetSince(new DateTime(2001, 02, 03), _token).ToList();

        _genericService.Verify(s => s.GetWhere("t.Time >= '2001-02-03T00:00:00'", _token));
        Assert.That(result, Is.EqualTo(new[]
        {
            _errorDto,
        }));
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    [TestCase(true, true)]
    public async Task AddError_GivenServerSideError_AddsError(bool loggedIn, bool permitted)
    {
        if (!loggedIn)
        {
            _user = null;
        }
        else if (!permitted)
        {
            _user!.Access!.ViewExceptions = false;
        }
        var details = new ExceptionHandlerPathFeature
        {
            Error = new Exception("some error"),
        };
        _errorDetailAdapter.Setup(a => a.Adapt(details, _token)).ReturnsAsync(_errorDto);

        await _service.AddError(details, _token);

        _commandFactory.Verify(f => f.GetCommand<AddErrorCommand>());
        _addErrorCommand.Verify(c => c.WithData(_errorDto));
        _genericService.Verify(s => s.Upsert(_errorDto.Id, _addErrorCommand.Object, _token));
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    [TestCase(true, true)]
    public async Task AddError_GivenClientSideError_AddsError(bool loggedIn, bool permitted)
    {
        if (!loggedIn)
        {
            _user = null;
        }
        else if (!permitted)
        {
            _user!.Access!.ViewExceptions = false;
        }

        await _service.AddError(_errorDto, _token);

        _commandFactory.Verify(f => f.GetCommand<AddErrorCommand>());
        _addErrorCommand.Verify(c => c.WithData(_errorDto));
        _genericService.Verify(s => s.Upsert(_errorDto.Id, _addErrorCommand.Object, _token));
    }

    private class ExceptionHandlerPathFeature : IExceptionHandlerPathFeature
    {
        public Exception Error { get; init; } = null!;
    }
}