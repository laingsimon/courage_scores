using System.Security.Cryptography;

namespace CourageScores.Services.Data;

public class ContentEncryptor : IContentEncryptor
{
    private readonly byte[] _key;

    public ContentEncryptor(string key)
    {
        var passwordBytes = System.Text.Encoding.UTF8.GetBytes("CourageScores:" + key);
        var aesMaxKeySize = 16;
        var aesKey = new byte[aesMaxKeySize];
        for (var i = 0; i < aesMaxKeySize; i++)
        {
            var passwordBytesIndex = i % passwordBytes.Length;
            aesKey[i] = passwordBytes[passwordBytesIndex];
        }

        _key = aesKey;
    }

    public async Task Encrypt(Stream source, Stream destination)
    {
        try
        {
            using (var aes = Aes.Create())
            {
                aes.Key = _key;
                var iv = aes.IV;

                await destination.WriteAsync(iv, 0, iv.Length);

                using (var cryptoStream = new CryptoStream(destination, aes.CreateEncryptor(), CryptoStreamMode.Write))
                {
                    await source.CopyToAsync(cryptoStream);
                }
            }
        }
        catch (CryptographicException exc)
        {
            throw new CryptographicException($"Unable to encrypt using key size {_key.Length}", exc);
        }
    }

    public async Task Decrypt(Stream source, Stream destination)
    {
        try
        {
            using (var aes = Aes.Create())
            {
                var iv = new byte[aes.IV.Length];
                var numBytesToRead = aes.IV.Length;
                var numBytesRead = 0;
                while (numBytesToRead > 0)
                {
                    var n = await source.ReadAsync(iv, numBytesRead, numBytesToRead);
                    if (n == 0)
                    {
                        break;
                    }

                    numBytesRead += n;
                    numBytesToRead -= n;
                }

                using (var cryptoStream =
                       new CryptoStream(source, aes.CreateDecryptor(_key, iv), CryptoStreamMode.Read))
                {
                    await cryptoStream.CopyToAsync(destination);
                }
            }
        }
        catch (CryptographicException exc)
        {
            throw new CryptographicException("Unable to decrypt the content, check you've supplied the correct password", exc);
        }
    }
}