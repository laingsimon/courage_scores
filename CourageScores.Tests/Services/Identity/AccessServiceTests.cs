using AutoFixture;
using CourageScores.Models.Adapters.Identity;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using Newtonsoft.Json;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Identity;

[TestFixture]
public class AccessServiceTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private AccessService _service = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var factory = AutoFixture.Create();
        factory.Freeze<AccessLevelAdapter>();
        factory.Register<IAccessLevelAdapter>(factory.Create<AccessLevelAdapter>);

        _service = factory.Create<AccessService>();
    }

    [Test]
    public async Task HasAccess_WhenUserHasNoAccess_ReturnsFalse()
    {
        var user = new UserDto();

        var result = await _service.HasAccess(user, AccessOption.AnalyseMatches, UserAccessContext.None(), _token);

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasAccess_WhenUserDtoDoesNotHaveAccess_ReturnsFalse()
    {
        var user = new UserDto();

        var result = await _service.HasAccess(user, AccessOption.AnalyseMatches, UserAccessContext.None(), _token);

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasAccess_WhenUserDtoDoesHaveAccess_ReturnsTrue()
    {
        var user = new UserDto
        {
            AccessLevels = new Dictionary<AccessOption, AccessLevelDto>
            {
                { AccessOption.AnalyseMatches, AccessLevelDto.Granted }
            }
        };

        var result = await _service.HasAccess(user, AccessOption.AnalyseMatches, UserAccessContext.None(), _token);

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task HasAccess_WhenUserDoesNotHaveAccess_ReturnsFalse()
    {
        var user = new User();

        var result = await _service.HasAccess(user, AccessOption.AnalyseMatches, UserAccessContext.None(), _token);

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasAccess_WhenUserAccessLevelsIsNull_ReturnsFalse()
    {
        var model = new User { AccessLevels = null! };
        var context = UserAccessContext.None();
        var option = AccessOption.AnalyseMatches;

        Assert.That(await _service.HasAccess(model, option, context, _token), Is.False);
    }

    [Test]
    public async Task HasAccess_WhenUserIsNull_ReturnsFalse()
    {
        User? model = null;
        UserDto? dto = null;
        var context = UserAccessContext.None();
        var option = AccessOption.AnalyseMatches;

        Assert.That(await _service.HasAccess(model, option, context, _token), Is.False);
        Assert.That(await _service.HasAccess(dto, option, context, _token), Is.False);
    }

    [Test]
    public async Task HasAccess_WhenUserDoesHaveAccess_ReturnsTrue()
    {
        var user = new User
        {
            AccessLevels = new Dictionary<AccessOption, AccessLevel>
            {
                { AccessOption.AnalyseMatches, AccessLevel.Granted }
            }
        };

        var result = await _service.HasAccess(user, AccessOption.AnalyseMatches, UserAccessContext.None(), _token);

        Assert.That(result, Is.True);
    }

    [TestCaseSource(nameof(GranularUserAccessTestCases))]
    public async Task HasAccess_GivenGranularUserAccessLevelAndUserContext_ReturnsCorrectly(GranularUserAccessTestCase testCase)
    {
        var (level, context, expected) = testCase;
        var user = new User
        {
            AccessLevels = new Dictionary<AccessOption, AccessLevel>
            {
                { AccessOption.AnalyseMatches, level }
            }
        };

        var result = await _service.HasAccess(user, AccessOption.AnalyseMatches, context, _token);

        Assert.That(result, Is.EqualTo(expected));
    }

    [Test]
    public async Task HasAccess_GivenAnyAccessOption_DoesNotThrow([Values] AccessOption accessOption)
    {
        var user = new UserDto();

        var result = await _service.HasAccess(user, accessOption, UserAccessContext.None(), _token);

        Assert.That(result, Is.False);
    }

    private static IEnumerable<GranularUserAccessTestCase> GranularUserAccessTestCases
    {
        get
        {
            var seasonId = Guid.Parse("00000000-0000-0000-0000-111111111111");
            var divisionId = Guid.Parse("00000000-0000-0000-0000-222222222222");
            var teamId = Guid.Parse("00000000-0000-0000-0000-333333333333");
            var otherId = Guid.Parse("00000000-0000-0000-0000-444444444444");

            yield return new GranularUserAccessTestCase(new AccessLevel(SeasonIds: [seasonId]), UserAccessContext.None(), true);
            yield return new GranularUserAccessTestCase(new AccessLevel(DivisionIds: [divisionId]), UserAccessContext.None(), true);
            yield return new GranularUserAccessTestCase(new AccessLevel(TeamIds: [teamId]), UserAccessContext.None(), true);

            yield return new GranularUserAccessTestCase(AccessLevel.Granted, UserAccessContext.ForSeason(seasonId), true);
            yield return new GranularUserAccessTestCase(AccessLevel.Granted, UserAccessContext.ForDivision(seasonId, divisionId), true);
            yield return new GranularUserAccessTestCase(AccessLevel.Granted, UserAccessContext.ForTeam(seasonId, divisionId, teamId), true);

            yield return new GranularUserAccessTestCase(new AccessLevel(SeasonIds: [seasonId]), UserAccessContext.ForSeason(seasonId), true);
            yield return new GranularUserAccessTestCase(new AccessLevel(DivisionIds: [divisionId]), UserAccessContext.ForDivision(seasonId, divisionId), true);
            yield return new GranularUserAccessTestCase(new AccessLevel(TeamIds: [teamId]), UserAccessContext.ForTeam(seasonId, divisionId, teamId), true);

            yield return new GranularUserAccessTestCase(new AccessLevel(SeasonIds: [seasonId]), UserAccessContext.ForSeason(otherId), false);
            yield return new GranularUserAccessTestCase(new AccessLevel(DivisionIds: [divisionId]), UserAccessContext.ForDivision(seasonId, otherId), false);
            yield return new GranularUserAccessTestCase(new AccessLevel(TeamIds: [teamId]), UserAccessContext.ForTeam(seasonId, divisionId, otherId), false);

            yield return new GranularUserAccessTestCase(new AccessLevel(SeasonIds: []), UserAccessContext.None(), false);
            yield return new GranularUserAccessTestCase(new AccessLevel(DivisionIds: []), UserAccessContext.None(), false);
            yield return new GranularUserAccessTestCase(new AccessLevel(TeamIds: []), UserAccessContext.None(), false);
        }
    }

    public sealed record GranularUserAccessTestCase(AccessLevel Level, UserAccessContext Context, bool Expected)
    {
        private static readonly JsonSerializerSettings SerializerSettings = new()
        {
            NullValueHandling = NullValueHandling.Ignore,
            DefaultValueHandling = DefaultValueHandling.Ignore
        };

        public override string ToString()
        {
            return $"{Serialise(Level)} & {Serialise(Context)}, Expected: {Expected}";
        }

        private static string Serialise<T>(T value)
        {
            return JsonConvert.SerializeObject(value, Formatting.None, SerializerSettings);
        }
    }
}
