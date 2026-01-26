using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.RemoteControl;

namespace CourageScores.Services.RemoteControl;

public interface IRemoteControlService
{
    Task<ActionResultDto<RemoteControlDto?>> Create(string pin, CancellationToken token);
    Task<ActionResultDto<RemoteControlDto?>> Delete(Guid id, string pin, CancellationToken token);
    Task<ActionResultDto<RemoteControlDto?>> Get(Guid id, string pin, CancellationToken token);
    Task<ActionResultDto<RemoteControlDto?>> Update(Guid id, RemoteControlUpdateDto update, CancellationToken token);
}
