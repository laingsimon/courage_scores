import {createContext, useContext} from "react";
import {IDivisionUri, IIdish} from "./IDivisionUri";
import {isGuid} from "../../helpers/projection";
import {any} from "../../helpers/collections";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {useApp} from "../common/AppContainer";
import {useLocation, useParams} from "react-router-dom";
import {Division} from "./Division";

function makeIdish(item: { id: string, name?: string}): IIdish {
    return {
        id: item.id,
        name: item.name,
        toString: () => {
            return item.name || item.id;
        }
    };
}

export const INVALID: IIdish = makeIdish({ id: 'INVALID' });

const DivisionUriContext = createContext({});

export function useDivisionUri(): IDivisionUri {
    return useContext(DivisionUriContext) as IDivisionUri;
}

export enum UrlStyle {
    Single = 'single-division',
    Multiple = 'multi-division',
}

export interface IDivisionUriContainerProps {
    urlStyle: UrlStyle;
    mode?: string;
}

/* istanbul ignore next */
export function DivisionUriContainer({ urlStyle, mode: overrideMode }: IDivisionUriContainerProps) {
    const {divisions, seasons} = useApp();
    const {divisionId, mode, seasonId} = useParams();
    const location = useLocation();
    const {onError} = useApp();

    function getDivisionId(idish?: string): IIdish {
        if (isGuid(idish)) {
            return makeIdish({ id: idish });
        }

        if (!divisions || !any(divisions) || !idish) {
            return INVALID;
        }

        const division: DivisionDto = divisions.filter((d: DivisionDto) => d.name.toLowerCase() === idish.toLowerCase())[0];
        return division ? makeIdish(division) : INVALID;
    }

    function getDivisionIdsFromUrl(): IIdish[] {
        const search = new URLSearchParams(location.search);

        if (!search.has('divisionId')) {
            return [ INVALID ];
        }

        const divisionIds: string[] = search.getAll('divisionId');
        return divisionIds.map(getDivisionId);
    }

    function getSeasonId(idish?: string): IIdish {
        if (isGuid(idish)) {
            return makeIdish({ id: idish });
        }

        if (!seasons || !any(seasons) || !idish) {
            return null;
        }

        const season: SeasonDto = seasons.filter((s: SeasonDto) => s.name.toLowerCase() === idish.toLowerCase())[0];
        return season ? makeIdish(season) : INVALID;
    }

    const data: IDivisionUri = {
        requestedMode: overrideMode || mode,
        requestedDivisions: urlStyle === 'single-division'
            ? [ getDivisionId(divisionId) ]
            : getDivisionIdsFromUrl(),
        requestedSeason: getSeasonId(seasonId),
    };

    try {
        return (<DivisionUriContext.Provider value={data}>
            <Division/>
        </DivisionUriContext.Provider>);
    } catch (e) {
        onError(e);
    }
}