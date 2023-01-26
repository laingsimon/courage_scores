using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Data;
using CourageScores.Services.Identity;
using Ionic.Zip;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Azure.Cosmos;
using Newtonsoft.Json;

namespace CourageScores.Services.Data;

public class DataService : IDataService
{
    private const string MetaJonFile = "meta.json";

    private readonly Database _database;
    private readonly ISystemClock _clock;
    private readonly IUserService _userService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IZipFileReaderFactory _zipFileReaderFactory;
    private readonly IDataImporterFactory _dataImporterFactory;
    private readonly ICosmosTableService _cosmosTableService;

    public DataService(
        Database database,
        ISystemClock clock,
        IUserService userService,
        IHttpContextAccessor httpContextAccessor,
        IZipFileReaderFactory zipFileReaderFactory,
        IDataImporterFactory dataImporterFactory,
        ICosmosTableService cosmosTableService)
    {
        _database = database;
        _clock = clock;
        _userService = userService;
        _httpContextAccessor = httpContextAccessor;
        _zipFileReaderFactory = zipFileReaderFactory;
        _dataImporterFactory = dataImporterFactory;
        _cosmosTableService = cosmosTableService;
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
            var builder = new ZipBuilder(request.Password);
            var apiRequest = _httpContextAccessor.HttpContext?.Request;
            var metaData = new ExportMetaData
            {
                Created = _clock.UtcNow.UtcDateTime,
                Creator = user.Name,
                Hostname = apiRequest?.Host.ToString() ?? _database.Client.Endpoint.Host,
            };
            await builder.AddFile(MetaJonFile, JsonConvert.SerializeObject(metaData));

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

            if (!zip.HasFile(MetaJonFile))
            {
                return Unsuccessful<ImportDataResultDto>($"Zip file does not contain a {MetaJonFile} file");
            }

            var tableImporter = await _dataImporterFactory.Create(request, result, _cosmosTableService.GetTables(token));
            var metaContent = await zip.ReadJson<ExportMetaData>(MetaJonFile);
            actionResult.Messages.Add(
                $"Processing data from {metaContent.Hostname} exported on {metaContent.Created:dd MMM yyyy} by {metaContent.Creator}");

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