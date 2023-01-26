using Newtonsoft.Json.Linq;

namespace CourageScores.Services.Data;

public interface IZipBuilder
{
    Task<byte[]> CreateZip();
    Task AddFile(string tableName, string id, JObject record);
    Task AddFile(string fileName, string content);
}