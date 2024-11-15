using System.Security.Cryptography;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Data;
using CourageScores.Repository;
using CourageScores.Services.Identity;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Services.Data;

public class DataService : IDataService
{
    private readonly IConfiguration _configuration;
    private readonly ICosmosTableService _cosmosTableService;
    private readonly Database _database;
    private readonly IDataImporterFactory _dataImporterFactory;
    private readonly IUserService _userService;
    private readonly IZipBuilderFactory _zipBuilderFactory;
    private readonly IZipFileReaderFactory _zipFileReaderFactory;
    private readonly IDataBrowserRepository<SingleDataResultDto> _dataBrowserRepository;
    private readonly IDataBrowserRepository<object> _dataViewRepository;

    public DataService(
        Database database,
        IUserService userService,
        IZipFileReaderFactory zipFileReaderFactory,
        IDataImporterFactory dataImporterFactory,
        ICosmosTableService cosmosTableService,
        IZipBuilderFactory zipBuilderFactory,
        IConfiguration configuration,
        IDataBrowserRepository<SingleDataResultDto> dataBrowserRepository,
        IDataBrowserRepository<object> dataViewRepository)
    {
        _database = database;
        _userService = userService;
        _zipFileReaderFactory = zipFileReaderFactory;
        _dataImporterFactory = dataImporterFactory;
        _cosmosTableService = cosmosTableService;
        _zipBuilderFactory = zipBuilderFactory;
        _configuration = configuration;
        _dataBrowserRepository = dataBrowserRepository;
        _dataViewRepository = dataViewRepository;
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

        return await DoExport(user.Name, request, token);
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

        return await DoImport(request, token);
    }

    public async Task<ActionResultDto<ExportDataResultDto>> BackupData(BackupDataRequestDto request, CancellationToken token)
    {
        if (string.IsNullOrEmpty(request.Identity))
        {
            return Unsuccessful<ExportDataResultDto>("Missing identity");
        }

        if (string.IsNullOrEmpty(request.RequestToken) || request.RequestToken != _configuration["BackupRequestToken"])
        {
            return Unsuccessful<ExportDataResultDto>("Invalid request token");
        }

        var exportRequest = new ExportDataRequestDto
        {
            Password = _configuration["BackupPassword"],
            IncludeDeletedEntries = true,
        };

        return await DoExport(request.Identity, exportRequest, token);
    }

    public async Task<ActionResultDto<ImportDataResultDto>> RestoreData(RestoreDataRequestDto request, CancellationToken token)
    {
        if (string.IsNullOrEmpty(request.Identity))
        {
            return Unsuccessful<ImportDataResultDto>("Missing identity");
        }

        if (string.IsNullOrEmpty(request.RequestToken) || request.RequestToken != _configuration["RestoreRequestToken"])
        {
            return Unsuccessful<ImportDataResultDto>("Invalid request token");
        }

        return await DoImport(request, token);
    }

    public async Task<ActionResultDto<IReadOnlyCollection<SingleDataResultDto>>> Browse(string table, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return Unsuccessful<IReadOnlyCollection<SingleDataResultDto>>("Not logged in");
        }

        if (user.Access?.ExportData != true)
        {
            return Unsuccessful<IReadOnlyCollection<SingleDataResultDto>>("Not permitted");
        }

        if (string.IsNullOrEmpty(table))
        {
            return Unsuccessful<IReadOnlyCollection<SingleDataResultDto>>("Table not supplied");
        }

        var tableExists = await _dataBrowserRepository.TableExists(table);
        if (!tableExists)
        {
            return Unsuccessful<IReadOnlyCollection<SingleDataResultDto>>($"Table not found: {table}");
        }

        return new ActionResultDto<IReadOnlyCollection<SingleDataResultDto>>
        {
            Result = await _dataBrowserRepository.GetAll(table, token).ToList(),
            Success = true,
        };
    }

    public async Task<ActionResultDto<object>> View(string table, Guid id, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return Unsuccessful<object>("Not logged in");
        }

        if (user.Access?.ExportData != true)
        {
            return Unsuccessful<object>("Not permitted");
        }

        if (string.IsNullOrEmpty(table))
        {
            return Unsuccessful<object>("Table not supplied");
        }

        var tableExists = await _dataViewRepository.TableExists(table);
        if (!tableExists)
        {
            return Unsuccessful<object>($"Table not found: {table}");
        }

        var item = await _dataViewRepository.GetItem(table, id, token);
        if (item == null)
        {
            return Unsuccessful<object>("Record not found");
        }

        return new ActionResultDto<object>
        {
            Result = item,
            Success = true,
        };
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
                reason,
            },
            Success = false,
        };
    }

    private async Task<ActionResultDto<ImportDataResultDto>> DoImport(ImportDataRequestDto request, CancellationToken token)
    {
        if (request.Zip == null)
        {
            return Unsuccessful<ImportDataResultDto>("No zip file provided");
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
        catch (CryptographicException)
        {
            actionResult.Errors.Add("Password is incorrect");
        }
        catch (Exception exc)
        {
            actionResult.Errors.Add(exc.Message);
        }

        return actionResult;
    }

    private async Task<ActionResultDto<ExportDataResultDto>> DoExport(string userName, ExportDataRequestDto request, CancellationToken token)
    {
        var result = new ExportDataResultDto();
        var actionResult = new ActionResultDto<ExportDataResultDto>
        {
            Result = result,
        };

        try
        {
            var builder = await _zipBuilderFactory.Create(userName, request, token);

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
}