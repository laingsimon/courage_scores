namespace CourageScores.Services.Data;

public interface IContentEncryptor
{
    Task Encrypt(Stream source, Stream destination);
    Task Decrypt(Stream source, Stream destination);
}