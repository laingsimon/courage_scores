namespace CourageScores.Services;

public interface IJsonSerializerService
{
    string SerialiseToString<T>(T value);
    T DeserialiseTo<T>(Stream stream);
    T DeserialiseTo<T>(string json);
}