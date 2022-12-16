﻿using System.Runtime.CompilerServices;
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
    private readonly Database _database;
    private readonly ISystemClock _clock;
    private readonly IUserService _userService;

    public DataService(Database database, ISystemClock clock, IUserService userService)
    {
        _database = database;
        _clock = clock;
        _userService = userService;
    }

    public async Task<ActionResultDto<ExportDataResultDto>> ExportData(ExportResultRequestDto request, CancellationToken token)
    {
        var user = await _userService.GetUser();
        if (user == null)
        {
            return UnsuccessfulExport("Not logged in");
        }

        if (user.Access?.ExportData != true)
        {
            return UnsuccessfulExport("Not permitted");
        }

        var result = new ExportDataResultDto();
        var actionResult = new ActionResultDto<ExportDataResultDto>
        {
            Result = result,
        };

        try
        {
            var builder = new ZipBuilder(request.Password);
            var metaData = new ExportMetaData
            {
                Created = _clock.UtcNow.UtcDateTime,
                Creator = user.Name,
                Hostname = _database.Client.Endpoint.Host,
            };
            await builder.AddFile("meta.json", JsonConvert.SerializeObject(metaData));

            await foreach (var table in GetTables(request, token))
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
        var user = await _userService.GetUser();
        if (user == null)
        {
            return UnsuccessfulImport("Not logged in");
        }

        if (user.Access?.ImportData != true)
        {
            return UnsuccessfulImport("Not permitted");
        }

        var result = new ImportDataResultDto();
        var actionResult = new ActionResultDto<ImportDataResultDto>
        {
            Result = result,
        };

        try
        {
            var zip = await ZipFileReader.OpenZipFile(request.Zip.OpenReadStream(), request.Password);

            if (!zip.HasFile("meta.json"))
            {
                return UnsuccessfulImport("Zip file does not contain a meta.json file");
            }

            var metaContent = await zip.ReadJson<ExportMetaData>("meta.json");
            actionResult.Messages.Add(
                $"Processing data from {metaContent.Hostname} exported on {metaContent.Created:dd MMM yyyy} by {metaContent.Creator}");

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

    public async IAsyncEnumerable<TableDto> GetTables([EnumeratorCancellation] CancellationToken token)
    {
        var iterator = _database.GetContainerQueryStreamIterator();
        while (iterator.HasMoreResults)
        {
            var container = await iterator.ReadNextAsync(token);
            var containerContent = ContainerItemJson.ReadContainerStream(container.Content);

            foreach (var table in containerContent.DocumentCollections)
            {
                var tableName = table.Id;

                var partitionKey = table.PartitionKey.Paths.Single();
                yield return new TableDto
                {
                    Name = tableName,
                    PartitionKey = partitionKey,
                };
            }
        }
    }

    private static ActionResultDto<ExportDataResultDto> UnsuccessfulExport(string reason)
    {
        return new ActionResultDto<ExportDataResultDto>
        {
            Errors =
            {
                reason
            },
            Success = false,
        };
    }

    private static ActionResultDto<ImportDataResultDto> UnsuccessfulImport(string reason)
    {
        return new ActionResultDto<ImportDataResultDto>
        {
            Errors =
            {
                reason
            },
            Success = false,
        };
    }

    private async IAsyncEnumerable<TableAccessor> GetTables(ExportResultRequestDto request, [EnumeratorCancellation] CancellationToken token)
    {
        await foreach (var table in GetTables(token))
        {
            if (request.Tables?.Any() == true &&
                !request.Tables.Contains(table.Name, StringComparer.OrdinalIgnoreCase))
            {
                // ignore table, as it hasn't been requested, but other tables have been
                continue;
            }

            yield return new TableAccessor(table.Name, table.PartitionKey);
        }
    }
}