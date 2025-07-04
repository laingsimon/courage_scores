﻿/* istanbul ignore file */

import { IAddableBuilder } from './builders';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { EditSeasonDto } from '../../interfaces/models/dtos/Season/EditSeasonDto';
import { createTemporaryId } from '../projection';

export interface ISeasonBuilder
    extends IAddableBuilder<SeasonDto & EditSeasonDto> {
    withDivision(divisionOrId: any): ISeasonBuilder;
    starting(date: string): ISeasonBuilder;
    ending(date: string): ISeasonBuilder;
    withDivisionId(divisionOrId: any): ISeasonBuilder;
    isCurrent(): ISeasonBuilder;
    updated(date: string): ISeasonBuilder;
    id(id: string): ISeasonBuilder;
    name(name: string): ISeasonBuilder;
}

export function seasonBuilder(name?: string, id?: string): ISeasonBuilder {
    const season: SeasonDto & EditSeasonDto = {
        id: id || createTemporaryId(),
        name: name || '',
        divisions: [],
        startDate: '',
        endDate: '',
    };

    const builder: ISeasonBuilder = {
        build: () => season,
        addTo: (map: any) => {
            map[season.id] = season;
            return builder;
        },
        withDivision: (divisionOrId: any) => {
            season.divisions?.push(
                divisionOrId.id
                    ? divisionOrId
                    : {
                          id: divisionOrId,
                      },
            );
            return builder;
        },
        starting: (date: string) => {
            season.startDate = date;
            return builder;
        },
        ending: (date: string) => {
            season.endDate = date;
            return builder;
        },
        withDivisionId: (divisionOrId: any) => {
            // this is for the editSeason dialog only
            season.divisionIds = season.divisionIds || [];
            season.divisionIds.push(
                divisionOrId.id ? divisionOrId.id : divisionOrId,
            );
            return builder;
        },
        isCurrent: () => {
            season.isCurrent = true;
            return builder;
        },
        updated: (date: string) => {
            season.updated = date;
            return builder;
        },
        id: (id: string) => {
            season.id = id;
            return builder;
        },
        name: (name: string) => {
            season.name = name;
            return builder;
        },
    };

    return builder;
}
