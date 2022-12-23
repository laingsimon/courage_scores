﻿using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Models.Adapters;

public class DivisionAdapter : IAdapter<Division, DivisionDto>
{
    public Task<DivisionDto> Adapt(Division model, CancellationToken token)
    {
        return Task.FromResult(new DivisionDto
        {
            Id = model.Id,
            Name = model.Name,
        }.AddAuditProperties(model));
    }

    public Task<Division> Adapt(DivisionDto dto, CancellationToken token)
    {
        return Task.FromResult(new Division
        {
            Id = dto.Id,
            Name = dto.Name.Trim(),
        }.AddAuditProperties(dto));
    }
}