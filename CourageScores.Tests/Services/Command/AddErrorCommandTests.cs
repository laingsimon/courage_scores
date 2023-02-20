using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Services.Command;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddErrorCommandTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private AddErrorCommand _command = null!;
    private ErrorDetailDto _update = null!;
    private ErrorDetail _error = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _command = new AddErrorCommand();
        _update = new ErrorDetailDto();
        _error = new ErrorDetail();
    }

    [Test]
    public async Task ApplyUpdate_WhenAllPropertiesSet_SetsPropertiesCorrectly()
    {
        _update.Message = "new message";
        _update.Source = SourceSystem.Api;
        _update.Stack = new[] {"frame1"};
        _update.Type = "type";
        _update.UserAgent = "user agent";
        _update.UserName = "user";
        _update.Time = new DateTime(2001, 02, 03);

        var result = await _command.WithData(_update).ApplyUpdate(_error, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(_error.Message, Is.EqualTo(_update.Message));
        Assert.That(_error.Source, Is.EqualTo(_update.Source));
        Assert.That(_error.Stack, Is.EqualTo(_update.Stack));
        Assert.That(_error.Type, Is.EqualTo(_update.Type));
        Assert.That(_error.UserAgent, Is.EqualTo(_update.UserAgent));
        Assert.That(_error.UserName, Is.EqualTo(_update.UserName));
        Assert.That(_error.Time, Is.EqualTo(_update.Time));
    }

    [Test]
    public async Task ApplyUpdate_WhenOptionalPropertiesAreNull_SetsPropertiesCorrectly()
    {
        _update.Message = "new message";
        _update.Source = SourceSystem.Api;
        _update.Stack = null;
        _update.Type = null;
        _update.UserAgent = "user agent";
        _update.UserName = null;
        _update.Time = new DateTime(2001, 02, 03);

        var result = await _command.WithData(_update).ApplyUpdate(_error, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(_error.Message, Is.EqualTo(_update.Message));
        Assert.That(_error.Source, Is.EqualTo(_update.Source));
        Assert.That(_error.Stack, Is.Null);
        Assert.That(_error.Type, Is.Null);
        Assert.That(_error.UserAgent, Is.EqualTo(_update.UserAgent));
        Assert.That(_error.UserName, Is.Null);
        Assert.That(_error.Time, Is.EqualTo(_update.Time));
    }
}