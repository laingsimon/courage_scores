using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class GameAdapterTests
{
    private static readonly GameMatch GameMatch = new();
    private static readonly GameMatchDto GameMatchDto = new();
    private static readonly GameTeam HomeTeam = new();
    private static readonly GameTeamDto HomeTeamDto = new();
    private static readonly GameTeam AwayTeam = new();
    private static readonly GameTeamDto AwayTeamDto = new();
    private static readonly GamePlayer OneEightyPlayer = new();
    private static readonly GamePlayerDto OneEightyPlayerDto = new();
    private static readonly NotablePlayer HiCheckPlayer = new();
    private static readonly GameMatchOption MatchOption = new();
    private static readonly GameMatchOptionDto MatchOptionDto = new();
    private static readonly NotablePlayerDto HiCheckPlayerDto = new();
    private readonly CancellationToken _token = new();
    private readonly GameAdapter _adapter = new(
        new MockAdapter<GameMatch, GameMatchDto>(new[]
        {
            GameMatch,
        }, new[]
        {
            GameMatchDto,
        }),
        new MockAdapter<GameTeam, GameTeamDto>(
            new[]
            {
                HomeTeam, AwayTeam,
            },
            new[]
            {
                HomeTeamDto, AwayTeamDto,
            }),
        new MockAdapter<GamePlayer, GamePlayerDto>(OneEightyPlayer, OneEightyPlayerDto),
        new MockAdapter<NotablePlayer, NotablePlayerDto>(HiCheckPlayer, HiCheckPlayerDto),
        new MockSimpleAdapter<GameMatchOption?, GameMatchOptionDto?>(MatchOption, MatchOptionDto));

    [Test]
    public async Task Adapt_GivenUnpublishedModel_SetPropertiesCorrectly()
    {
        var model = new CosmosGame
        {
            Address = "address",
            Away = AwayTeam,
            Date = new DateTime(2001, 02, 03),
            Home = HomeTeam,
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            SeasonId = Guid.NewGuid(),
            Postponed = true,
            IsKnockout = true,
            HomeSubmission = new CosmosGame(),
            AwaySubmission = new CosmosGame(),
            OneEighties =
            {
                OneEightyPlayer,
            },
            Over100Checkouts =
            {
                HiCheckPlayer,
            },
            AccoladesCount = true,
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Address, Is.EqualTo(model.Address));
        Assert.That(result.Date, Is.EqualTo(model.Date));
        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.DivisionId, Is.EqualTo(model.DivisionId));
        Assert.That(result.SeasonId, Is.EqualTo(model.SeasonId));
        Assert.That(result.Postponed, Is.EqualTo(model.Postponed));
        Assert.That(result.IsKnockout, Is.EqualTo(model.IsKnockout));
        Assert.That(result.Home, Is.SameAs(HomeTeamDto));
        Assert.That(result.Away, Is.SameAs(AwayTeamDto));
        Assert.That(result.HomeSubmission, Is.Not.Null);
        Assert.That(result.AwaySubmission, Is.Not.Null);
        Assert.That(result.OneEighties, Is.EqualTo(new[]
        {
            OneEightyPlayerDto,
        }));
        Assert.That(result.Over100Checkouts, Is.EqualTo(new[]
        {
            HiCheckPlayerDto,
        }));
        Assert.That(result.AccoladesCount, Is.EqualTo(model.AccoladesCount));
    }

    [Test]
    public async Task Adapt_GivenPublishedModel_SetPropertiesCorrectly()
    {
        var model = new CosmosGame
        {
            Matches =
            {
                GameMatch,
            },
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Matches, Is.EqualTo(new[]
        {
            GameMatchDto,
        }));
        Assert.That(result.HomeSubmission, Is.Null);
        Assert.That(result.AwaySubmission, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenDtoWithOneEightiesAndHiCheckInRootProperties_SetPropertiesCorrectly()
    {
        var dto = new GameDto
        {
            Address = "address",
            Away = AwayTeamDto,
            Date = new DateTime(2001, 02, 03),
            Home = HomeTeamDto,
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            SeasonId = Guid.NewGuid(),
            Postponed = true,
            IsKnockout = true,
            HomeSubmission = new GameDto
            {
                Address = "address",
            },
            AwaySubmission = new GameDto
            {
                Address = "address",
            },
            Matches =
            {
                GameMatchDto,
            },
            OneEighties =
            {
                OneEightyPlayerDto,
            },
            Over100Checkouts =
            {
                HiCheckPlayerDto,
            },
            AccoladesCount = true,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Address, Is.EqualTo(dto.Address));
        Assert.That(result.Date, Is.EqualTo(dto.Date));
        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.DivisionId, Is.EqualTo(dto.DivisionId));
        Assert.That(result.SeasonId, Is.EqualTo(dto.SeasonId));
        Assert.That(result.Postponed, Is.EqualTo(dto.Postponed));
        Assert.That(result.IsKnockout, Is.EqualTo(dto.IsKnockout));
        Assert.That(result.Home, Is.SameAs(HomeTeam));
        Assert.That(result.Away, Is.SameAs(AwayTeam));
        Assert.That(result.Matches, Is.EqualTo(new[]
        {
            GameMatch,
        }));
        Assert.That(result.HomeSubmission, Is.Not.Null);
        Assert.That(result.AwaySubmission, Is.Not.Null);
        Assert.That(result.OneEighties, Is.EqualTo(new[]
        {
            OneEightyPlayer,
        }));
        Assert.That(result.Over100Checkouts, Is.EqualTo(new[]
        {
            HiCheckPlayer,
        }));
        Assert.That(result.AccoladesCount, Is.EqualTo(dto.AccoladesCount));
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsWhiteSpace()
    {
        var dto = new GameDto
        {
            Address = "address   ",
            Away = AwayTeamDto,
            Date = new DateTime(2001, 02, 03),
            Home = HomeTeamDto,
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            SeasonId = Guid.NewGuid(),
            Postponed = true,
            IsKnockout = true,
            HomeSubmission = new GameDto
            {
                Address = "address  ",
            },
            AwaySubmission = new GameDto
            {
                Address = "address  ",
            },
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Address, Is.EqualTo("address"));
        Assert.That(result.HomeSubmission!.Address, Is.EqualTo("address"));
        Assert.That(result.AwaySubmission!.Address, Is.EqualTo("address"));
    }
}