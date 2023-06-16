using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class CreateTournamentMatchSaygCommandTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private CreateTournamentMatchSaygCommand _command = null!;
    private CreateTournamentSaygDto _request = null!;
    private TournamentGame _tournament = null!;
    private Mock<IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto>> _saygService = null!;
    private Mock<ICommandFactory> _commandFactory = null!;
    private Mock<AddOrUpdateSaygCommand> _addSaygCommand = null!;
    private ActionResultDto<RecordedScoreAsYouGoDto> _addSaygCommandResult = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _saygService = new Mock<IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto>>();
        _commandFactory = new Mock<ICommandFactory>();
        _addSaygCommand = new Mock<AddOrUpdateSaygCommand>(
            new Mock<ISimpleAdapter<Leg, LegDto>>().Object,
            new Mock<IUserService>().Object);
        _command = new CreateTournamentMatchSaygCommand(_saygService.Object, _commandFactory.Object);
        _request = new CreateTournamentSaygDto
        {
            MatchId = Guid.NewGuid(),
            MatchOptions = new GameMatchOption
            {
                StartingScore = 601,
                NumberOfLegs = 7,
            }
        };
        _tournament = new TournamentGame();

        _commandFactory.Setup(f => f.GetCommand<AddOrUpdateSaygCommand>()).Returns(_addSaygCommand.Object);
        _addSaygCommand
            .Setup(c => c.WithData(It.IsAny<UpdateRecordedScoreAsYouGoDto>()))
            .Returns(_addSaygCommand.Object);
        _saygService.Setup(s => s.Upsert(It.IsAny<Guid>(), _addSaygCommand.Object, _token))
            .ReturnsAsync(() => _addSaygCommandResult);
    }

    [Test]
    public async Task ApplyUpdate_WithNoRounds_ReturnsUnsuccessful()
    {
        var result = await _command.WithRequest(_request).ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[] { "Match not found" }));
    }

    [Test]
    public async Task ApplyUpdate_WithUnknownMatchId_ReturnsUnsuccessful()
    {
        var match = new TournamentMatch
        {
            Id = Guid.NewGuid(),
        };
        _tournament.Round = new TournamentRound
        {
            Matches = { match }
        };

        var result = await _command.WithRequest(_request).ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[] { "Match not found" }));
    }

    [Test]
    public async Task ApplyUpdate_WithExistingSaygForMatch_ReturnsSuccessful()
    {
        var match = new TournamentMatch
        {
            Id = _request.MatchId,
            SaygId = Guid.NewGuid(),
        };
        _tournament.Round = new TournamentRound
        {
            Matches = { match }
        };

        var result = await _command.WithRequest(_request).ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Warnings, Is.EqualTo(new[] { "Match already has a sayg id" }));
    }

    [Test]
    public async Task ApplyUpdate_WithNoSaygForMatchAndUnableToCreate_ReturnsUnsuccessful()
    {
        var match = new TournamentMatch
        {
            Id = _request.MatchId,
            SideA = new TournamentSide { Name = "YOU" },
            SideB = new TournamentSide { Name = "THEM" },
        };
        _tournament.Round = new TournamentRound
        {
            Matches = { match }
        };
        _addSaygCommandResult = new ActionResultDto<RecordedScoreAsYouGoDto>
        {
            Success = false,
            Errors = { "Some error adding sayg" },
        };

        var result = await _command.WithRequest(_request).ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(match.SaygId, Is.Null);
        Assert.That(result.Errors, Is.EqualTo(new[] { "Some error adding sayg" }));
        _addSaygCommand
            .Verify(s => s.WithData(
                It.Is<UpdateRecordedScoreAsYouGoDto>(dto => dto.TournamentMatchId == match.Id)));
    }

    [Test]
    public async Task ApplyUpdate_WithNoSaygForMatch_CreatesSaygRecordAndReturnsSuccessful()
    {
        var match = new TournamentMatch
        {
            Id = _request.MatchId,
            SideA = new TournamentSide { Name = "YOU" },
            SideB = new TournamentSide { Name = "THEM" },
        };
        var newId = Guid.NewGuid();
        _tournament.Round = new TournamentRound
        {
            Matches = { match }
        };
        _addSaygCommandResult = new ActionResultDto<RecordedScoreAsYouGoDto>
        {
            Success = true,
            Result = new RecordedScoreAsYouGoDto
            {
                Id = newId
            }
        };

        var result = await _command.WithRequest(_request).ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(match.SaygId, Is.EqualTo(newId));
        Assert.That(result.Messages, Is.EqualTo(new[] { "Sayg added to match" }));
        _addSaygCommand
            .Verify(s => s.WithData(
                It.Is<UpdateRecordedScoreAsYouGoDto>(dto =>
                    dto.TournamentMatchId == match.Id
                    && dto.StartingScore == 601
                    && dto.NumberOfLegs == 7
                    && dto.YourName == "YOU"
                    && dto.OpponentName == "THEM")));
    }

    [Test]
    public async Task ApplyUpdate_WithNoSaygForMatchAndNoMatchOptions_CreatesSaygRecordWithBestOfMatchOptions()
    {
        var match = new TournamentMatch
        {
            Id = _request.MatchId,
            SideA = new TournamentSide { Name = "YOU" },
            SideB = new TournamentSide { Name = "THEM" },
        };
        var newId = Guid.NewGuid();
        _tournament.Round = new TournamentRound
        {
            Matches = { match },
        };
        _addSaygCommandResult = new ActionResultDto<RecordedScoreAsYouGoDto>
        {
            Success = true,
            Result = new RecordedScoreAsYouGoDto
            {
                Id = newId
            }
        };
        _request.MatchOptions = null;
        _tournament.BestOf = 7;

        var result = await _command.WithRequest(_request).ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(match.SaygId, Is.EqualTo(newId));
        Assert.That(result.Messages, Is.EqualTo(new[] { "Sayg added to match" }));
        _addSaygCommand
            .Verify(s => s.WithData(
                It.Is<UpdateRecordedScoreAsYouGoDto>(dto =>
                    dto.TournamentMatchId == match.Id
                    && dto.StartingScore == 501
                    && dto.NumberOfLegs == 7
                    && dto.YourName == "YOU"
                    && dto.OpponentName == "THEM")));
    }

    [Test]
    public async Task ApplyUpdate_WithNoSaygForMatchAndNoMatchOptions_CreatesSaygRecordWithDefaultMatchOptions()
    {
        var match = new TournamentMatch
        {
            Id = _request.MatchId,
            SideA = new TournamentSide { Name = "YOU" },
            SideB = new TournamentSide { Name = "THEM" },
        };
        var newId = Guid.NewGuid();
        _tournament.Round = new TournamentRound
        {
            Matches = { match },
        };
        _addSaygCommandResult = new ActionResultDto<RecordedScoreAsYouGoDto>
        {
            Success = true,
            Result = new RecordedScoreAsYouGoDto
            {
                Id = newId
            }
        };
        _request.MatchOptions = null;

        var result = await _command.WithRequest(_request).ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(match.SaygId, Is.EqualTo(newId));
        Assert.That(result.Messages, Is.EqualTo(new[] { "Sayg added to match" }));
        _addSaygCommand
            .Verify(s => s.WithData(
                It.Is<UpdateRecordedScoreAsYouGoDto>(dto =>
                    dto.TournamentMatchId == match.Id
                    && dto.StartingScore == 501
                    && dto.NumberOfLegs == 5
                    && dto.YourName == "YOU"
                    && dto.OpponentName == "THEM")));
    }
}