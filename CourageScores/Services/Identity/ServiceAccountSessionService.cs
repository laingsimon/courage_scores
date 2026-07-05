using System.Runtime.CompilerServices;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Command;

namespace CourageScores.Services.Identity;

public class ServiceAccountSessionService : IServiceAccountSessionService
{
    private readonly IUserService _userService;
    private readonly IGenericDataService<ServiceAccountSession, ServiceAccountSessionDto> _dataService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IServiceAccountSessionCleanUpService _cleanupService;
    private readonly IAccessService _accessService;

    public ServiceAccountSessionService(IUserService userService,
        IGenericDataService<ServiceAccountSession, ServiceAccountSessionDto> dataService,
        IHttpContextAccessor httpContextAccessor,
        IServiceAccountSessionCleanUpService cleanupService,
        IAccessService accessService)
    {
        _userService = userService;
        _dataService = dataService;
        _httpContextAccessor = httpContextAccessor;
        _cleanupService = cleanupService;
        _accessService = accessService;
    }

    public async Task<bool> SignOutAsync(CancellationToken token)
    {
        var httpContext = _httpContextAccessor.HttpContext!;
        var requestCookies = httpContext.Request.Cookies;
        var responseCookies = httpContext.Response.Cookies;

        if (requestCookies.TryGetValue(ServiceAccountSessionDto.SessionVerificationCookieName, out _))
        {
            // delete this cookie
            responseCookies.Delete(ServiceAccountSessionDto.SessionVerificationCookieName);
        }

        if (requestCookies.TryGetValue(ServiceAccountSessionDto.ActivatedSessionIdCookieName, out var activatedSessionCookie))
        {
            // delete this cookie
            responseCookies.Delete(ServiceAccountSessionDto.ActivatedSessionIdCookieName);
            if (Guid.TryParse(activatedSessionCookie, out var sessionId))
            {
                await _dataService.Delete(sessionId, token);
            }

            return true;
        }

        return false;
    }

    public async Task<ServiceAccountSessionDto?> Get(Guid id, CancellationToken token)
    {
        try
        {
            var session = await _dataService.Get(id, token);
            if (session == null)
            {
                return null;
            }

            var user = await _userService.GetUser(token);
            if (await _accessService.HasAccess(user, AccessOption.LoginServiceAccounts, UserAccessContext.Admin(), token))
            {
                return session;
            }

            var httpContext = _httpContextAccessor.HttpContext!;

            if (session.ServiceIpAddress != httpContext.Connection.RemoteIpAddress?.ToString())
            {
                return null;
            }

            var httpRequest = httpContext.Request;

            if (!httpRequest.Cookies.TryGetValue(ServiceAccountSessionDto.SessionVerificationCookieName, out var cookieValue) ||
                cookieValue != session.VerificationValue)
            {
                return null;
            }

            return session;
        }
        finally
        {
            await _cleanupService.DeleteExpiredSessions(token);
        }
    }

    public async IAsyncEnumerable<ServiceAccountSessionDto> GetAll([EnumeratorCancellation] CancellationToken token)
    {
        await _cleanupService.DeleteExpiredSessions(token);

        var user = await _userService.GetUser(token);
        if (!await _accessService.HasAccess(user, AccessOption.LoginServiceAccounts, UserAccessContext.Admin(), token))
        {
            yield break;
        }

        await foreach (var session in _dataService.GetAll(token))
        {
            yield return session;
        }
    }

    public IAsyncEnumerable<ServiceAccountSessionDto> GetWhere(string query, CancellationToken token)
    {
        throw new NotSupportedException();
    }

    public async Task<ActionResultDto<ServiceAccountSessionDto>> Upsert<TOut>(Guid? id, IUpdateCommand<ServiceAccountSession, TOut> updateCommand, CancellationToken token)
    {
        await _cleanupService.DeleteExpiredSessions(token);
        return await _dataService.Upsert(id, updateCommand, token);
    }

    public Task<ActionResultDto<ServiceAccountSessionDto>> Delete(Guid id, CancellationToken token)
    {
        throw new NotSupportedException();
    }
}
