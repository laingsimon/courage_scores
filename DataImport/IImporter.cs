namespace DataImport;

public interface IImporter
{
    Task RunImport(AccessDatabase source, CosmosDatabase destination, CancellationToken token);
}