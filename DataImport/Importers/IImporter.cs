namespace DataImport.Importers;

public interface IImporter
{
    Task<bool> RunImport(AccessDatabase source, CosmosDatabase destination, ImportContext context, CancellationToken token);
}