namespace DataImport;

public interface INameComparer
{
    bool PlayerNameEquals(string cosmosName, string accessName, string teamName);
}