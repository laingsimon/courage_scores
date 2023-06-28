using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Data;
using CourageScores.Services.Identity;
using Ionic.Zip;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Services.Data;

public class DataService : IDataService
{
    private readonly Database _database;
    private readonly IUserService _userService;
    private readonly IZipFileReaderFactory _zipFileReaderFactory;
    private readonly IDataImporterFactory _dataImporterFactory;
    private readonly ICosmosTableService _cosmosTableService;
    private readonly IZipBuilderFactory _zipBuilderFactory;

    public DataService(
        Database database,
        IUserService userService,
        IZipFileReaderFactory zipFileReaderFactory,
        IDataImporterFactory dataImporterFactory,
        ICosmosTableService cosmosTableService,
        IZipBuilderFactory zipBuilderFactory)
    {
        _database = database;
        _userService = userService;
        _zipFileReaderFactory = zipFileReaderFactory;
        _dataImporterFactory = dataImporterFactory;
        _cosmosTableService = cosmosTableService;
        _zipBuilderFactory = zipBuilderFactory;
    }

    public async Task<ActionResultDto<ExportDataResultDto>> ExportData(ExportDataRequestDto request, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return Unsuccessful<ExportDataResultDto>("Not logged in");
        }

        if (user.Access?.ExportData != true)
        {
            return Unsuccessful<ExportDataResultDto>("Not permitted");
        }

        var result = new ExportDataResultDto();
        var actionResult = new ActionResultDto<ExportDataResultDto>
        {
            Result = result,
        };

        try
        {
            var builder = await _zipBuilderFactory.Create(request.Password, request, token);

            await foreach (var table in _cosmosTableService.GetTables(request, token))
            {
                await table.ExportData(_database, result, builder, request, token);
            }

            result.Zip = await builder.CreateZip();

            actionResult.Success = true;
        }
        catch (Exception exc)
        {
            actionResult.Errors.Add(exc.Message);
        }

        return actionResult;
    }

    public async Task<ActionResultDto<ImportDataResultDto>> ImportData(ImportDataRequestDto request, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return Unsuccessful<ImportDataResultDto>("Not logged in");
        }

        if (user.Access?.ImportData != true)
        {
            return Unsuccessful<ImportDataResultDto>("Not permitted");
        }

        var result = new ImportDataResultDto();
        var actionResult = new ActionResultDto<ImportDataResultDto>
        {
            Result = result,
        };

        try
        {
            var zip = await _zipFileReaderFactory.Create(request.Zip.OpenReadStream(), request.Password);

            if (!zip.HasFile(ExportMetaData.FileName))
            {
                return Unsuccessful<ImportDataResultDto>($"Zip file does not contain a {ExportMetaData.FileName} file");
            }

            var tableImporter = await _dataImporterFactory.Create(request, result, _cosmosTableService.GetTables(token));
            var metaContent = await zip.ReadJson<ExportMetaData>(ExportMetaData.FileName);
            actionResult.Messages.Add(
                $"Processing data from {metaContent.Hostname} exported on {metaContent.Created:dd MMM yyyy} by {metaContent.Creator}");

            if (IsEqualOrLaterVersion(metaContent, "v2") && metaContent.RequestedTables.Any(t => t.Value.Any()))
            {
                actionResult.Messages.Add($"This is a partial export of {string.Join(", ", metaContent.RequestedTables.Keys)}");

                if (request.PurgeData)
                {
                    return Unsuccessful<ImportDataResultDto>("Purge is not permitted for partial data exports");
                }
            }

            if (request.PurgeData)
            {
                actionResult.Messages.AddRange(await tableImporter.PurgeData(request.Tables, token).ToList());
            }

            actionResult.Messages.AddRange(await tableImporter.ImportData(request.Tables, zip, token).ToList());

            actionResult.Success = true;
        }
        catch (BadPasswordException)
        {
            actionResult.Errors.Add("Password is incorrect");
        }
        catch (Exception exc)
        {
            actionResult.Errors.Add(exc.Message);
        }

        return actionResult;
    }

    private static bool IsEqualOrLaterVersion(ExportMetaData metaData, string minVersion)
    {
        return StringComparer.OrdinalIgnoreCase.Compare(metaData.Version, minVersion) >= 0;
    }

    private static ActionResultDto<T> Unsuccessful<T>(string reason)
    {
        return new ActionResultDto<T>
        {
            Errors =
            {
                reason
            },
            Success = false,
        };
    }
}