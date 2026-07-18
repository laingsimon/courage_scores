using AutoFixture;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services.Identity;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class TournamentRoundAdapterTests
{
    private static readonly TournamentSide Side = new();
    private static readonly TournamentSideDto SideDto = new();
    private static readonly TournamentMatch Match = new();
    private static readonly TournamentMatchDto MatchDto = new();
    private static readonly GameMatchOption MatchOption = new();
    private static readonly GameMatchOptionDto MatchOptionDto = new();
    private readonly CancellationToken _token = CancellationToken.None;
    private TournamentRoundAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();

        fixture.Register<IAdapter<TournamentMatch, TournamentMatchDto>>(() => new MockAdapter<TournamentMatch, TournamentMatchDto>(Match, MatchDto));
        fixture.Register<ISimpleAdapter<TournamentSide, TournamentSideDto>>(() => new MockSimpleAdapter<TournamentSide, TournamentSideDto>(Side, SideDto));
        fixture.Register<ISimpleAdapter<GameMatchOption?, GameMatchOptionDto?>>(() => new MockSimpleAdapter<GameMatchOption?, GameMatchOptionDto?>(MatchOption, MatchOptionDto));

        _adapter = fixture.Create<TournamentRoundAdapter>();
    }

    [Test]
    public async Task Adapt_GivenModelWithoutNextRound_SetsPropertiesCorrectly()
    {
        var model = new TournamentRound
        {
            Id = Guid.NewGuid(),
            Matches =
            {
                Match,
            },
            Sides =
            {
                Side,
            },
            NextRound = null,
            Name = "name",
            MatchOptions =
            {
                MatchOption,
            },
        };

        var result = await _adapter.Adapt(model, UserAccessContext.None(), _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Matches, Is.EqualTo([MatchDto]));
        Assert.That(result.Sides, Is.EqualTo([SideDto]));
        Assert.That(result.NextRound, Is.Null);
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.MatchOptions, Is.EqualTo([MatchOptionDto]));
    }

    [Test]
    public async Task Adapt_GivenModelWithNextRound_SetsPropertiesCorrectly()
    {
        var nextRound = new TournamentRound
        {
            Id = Guid.NewGuid(),
        };
        var model = new TournamentRound
        {
            Id = Guid.NewGuid(),
            Matches =
            {
                Match,
            },
            Sides =
            {
                Side,
            },
            NextRound = nextRound,
            Name = "name",
            MatchOptions =
            {
                MatchOption,
            },
        };

        var result = await _adapter.Adapt(model, UserAccessContext.None(), _token);

        Assert.That(result.NextRound, Is.Not.Null);
        Assert.That(result.NextRound!.Id, Is.EqualTo(nextRound.Id));
        Assert.That(result.MatchOptions, Is.EqualTo([MatchOptionDto]));
    }

    [Test]
    public async Task Adapt_GivenDtoWithoutNextRound_SetsPropertiesCorrectly()
    {
        var dto = new TournamentRoundDto
        {
            Id = Guid.NewGuid(),
            Matches =
            {
                MatchDto,
            },
            Sides =
            {
                SideDto,
            },
            NextRound = null,
            Name = "name",
            MatchOptions =
            {
                MatchOptionDto,
            },
        };

        var result = await _adapter.Adapt(dto, UserAccessContext.None(), _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Matches, Is.EqualTo([Match]));
        Assert.That(result.Sides, Is.EqualTo([Side]));
        Assert.That(result.NextRound, Is.Null);
        Assert.That(result.Name, Is.EqualTo(dto.Name));
        Assert.That(result.MatchOptions, Is.EqualTo([MatchOption]));
    }

    [Test]
    public async Task Adapt_GivenDtoWithNextRound_SetsPropertiesCorrectly()
    {
        var nextRound = new TournamentRoundDto
        {
            Id = Guid.NewGuid(),
        };
        var dto = new TournamentRoundDto
        {
            Id = Guid.NewGuid(),
            Matches =
            {
                MatchDto,
            },
            Sides =
            {
                SideDto,
            },
            NextRound = nextRound,
            Name = "name",
            MatchOptions =
            {
                MatchOptionDto,
            },
        };

        var result = await _adapter.Adapt(dto, UserAccessContext.None(), _token);

        Assert.That(result.NextRound, Is.Not.Null);
        Assert.That(result.NextRound!.Id, Is.EqualTo(nextRound.Id));
        Assert.That(result.MatchOptions, Is.EqualTo([MatchOption]));
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsWhitespace()
    {
        var dto = new TournamentRoundDto
        {
            Name = "name   ",
        };

        var result = await _adapter.Adapt(dto, UserAccessContext.None(), _token);

        Assert.That(result.Name, Is.EqualTo("name"));
    }

    [Test]
    public async Task Adapt_GivenDto_AcceptsNoName()
    {
        var dto = new TournamentRoundDto
        {
            Name = null,
        };

        var result = await _adapter.Adapt(dto, UserAccessContext.None(), _token);

        Assert.That(result.Name, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenModelWithNoMatchOptions_AcceptsNoMatchOptions()
    {
        var model = new TournamentRound();

        var result = await _adapter.Adapt(model, UserAccessContext.None(), _token);

        Assert.That(result.MatchOptions, Is.Empty);
    }

    [Test]
    public async Task Adapt_GivenDtoWithNoMatchOptions_AcceptsNoMatchOptions()
    {
        var dto = new TournamentRoundDto();

        var result = await _adapter.Adapt(dto, UserAccessContext.None(), _token);

        Assert.That(result.MatchOptions, Is.Empty);
    }
}
