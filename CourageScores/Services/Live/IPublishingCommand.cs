namespace CourageScores.Services.Live;

public interface IPublishingCommand<in TModel>
{
    Task PublishUpdate(TModel updatedItem, bool deleted, CancellationToken token);
}