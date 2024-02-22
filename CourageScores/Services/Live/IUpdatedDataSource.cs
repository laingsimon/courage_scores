using CourageScores.Models.Dtos.Live;

namespace CourageScores.Services.Live;

public interface IUpdatedDataSource
{
    Task<PollingUpdatesProcessor.UpdateData?> GetUpdate(Guid id, LiveDataType? type, DateTimeOffset? since);
}