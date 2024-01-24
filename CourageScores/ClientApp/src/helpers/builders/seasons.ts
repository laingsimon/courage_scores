import {IAddableBuilder} from "./builders";
import {ISeasonDto} from "../../interfaces/serverSide/Season/ISeasonDto";
import {IEditSeasonDto} from "../../interfaces/serverSide/Season/IEditSeasonDto";
import {createTemporaryId} from "../projection";

export interface ISeasonBuilder extends IAddableBuilder<ISeasonDto & IEditSeasonDto> {
    withDivision: (divisionOrId: any) => ISeasonBuilder;
    starting: (date: string) => ISeasonBuilder;
    ending: (date: string) => ISeasonBuilder;
    withDivisionId: (divisionOrId: any) => ISeasonBuilder;
    isCurrent: () => ISeasonBuilder;
}

export function seasonBuilder(name?: string, id?: string): ISeasonBuilder {
    const season: ISeasonDto & IEditSeasonDto = {
        id: id || createTemporaryId(),
        name,
        divisions: [],
    };

    const builder: ISeasonBuilder = {
        build: () => season,
        addTo: (map: any) => {
            map[season.id] = season;
            return builder;
        },
        withDivision: (divisionOrId: any) => {
            season.divisions.push(divisionOrId.id ? divisionOrId : {
                id: divisionOrId,
                name: undefined
            });
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
            season.divisionIds.push(divisionOrId.id ? divisionOrId.id : divisionOrId);
            return builder;
        },
        isCurrent: () => {
            season.isCurrent = true;
            return builder;
        }
    };

    return builder;
}
