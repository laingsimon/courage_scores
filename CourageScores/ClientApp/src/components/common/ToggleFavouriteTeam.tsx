import {any} from "../../helpers/collections";
import {usePreferences} from "./PreferencesContainer";
import {useDivisionData} from "../league/DivisionDataContainer";

export interface IToggleFavouriteTeamProps {
    teamId: string;
}

export function ToggleFavouriteTeam({ teamId }: IToggleFavouriteTeamProps) {
    const { getPreference, upsertPreference } = usePreferences();
    const { favouritesEnabled } = useDivisionData();
    const favouriteTeamIds: string[] = getPreference<string[]>('favouriteTeamIds') || [];
    const isFavourite: boolean = any(favouriteTeamIds, id => id === teamId);

    if (!favouritesEnabled) {
        return null;
    }

    function toggleFavourite(teamId: string) {
        const newFavourites: string[] = any(favouriteTeamIds, (id: string) => id === teamId)
            ? favouriteTeamIds.filter(id => id !== teamId)
            : favouriteTeamIds.concat(teamId);

        upsertPreference('favouriteTeamIds', newFavourites);
    }

    return (<button onClick={() => toggleFavourite(teamId)}
                    tabIndex={-1}
                    datatype="toggle-favourite"
                    className={(isFavourite ? '' : 'opacity-25') + ' bg-white border-0 p-0 m-0 me-1'}>
        ⭐
    </button>);
}