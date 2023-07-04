namespace CourageScores.Repository;

public class CosmosTableNameResolver : ICosmosTableNameResolver
{
    private readonly string _suffix;

    public CosmosTableNameResolver(IConfiguration configuration)
    {
        _suffix = configuration["TableNameSuffix"] ?? "";
    }

    public string GetTableName<T>()
    {
        return typeof(T).Name.ToLower() + _suffix;
    }

    public string GetTableTypeName(string tableName)
    {
        if (tableName.EndsWith(_suffix))
        {
            return tableName.Substring(0, tableName.Length - _suffix.Length);
        }

        return tableName;
    }
}