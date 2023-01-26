using System.Text;
using Newtonsoft.Json;

namespace CourageScores.Services;

public class JsonSerializerService : IJsonSerializerService
{
    private readonly JsonSerializer _serializer;

    public JsonSerializerService(JsonSerializer serializer)
    {
        _serializer = serializer;
    }

    public string SerialiseToString<T>(T value)
    {
        var stringBuilder = new StringBuilder();
        using (var jsonWriter = new JsonTextWriter(new StringWriter(stringBuilder)))
        {
            _serializer.Serialize(jsonWriter, value);
        }

        return stringBuilder.ToString();
    }

    public T DeserialiseTo<T>(Stream stream)
    {
        using (var reader = new JsonTextReader(new StreamReader(stream)))
        {
            return _serializer.Deserialize<T>(reader);
        }
    }

    public T DeserialiseTo<T>(string json)
    {
        using (var reader = new JsonTextReader(new StringReader(json)))
        {
            return _serializer.Deserialize<T>(reader);
        }
    }
}