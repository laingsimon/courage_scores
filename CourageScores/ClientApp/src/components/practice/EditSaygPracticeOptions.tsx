import {valueChanged} from "../../helpers/events";
import {ShareButton} from "../common/ShareButton";
import {useSayg} from "../sayg/SaygLoadingContainer";
import {UpdateRecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";
import {useEditableSayg} from "../sayg/EditableSaygContainer";
import {useLocation, useNavigate} from "react-router-dom";

export function EditSaygPracticeOptions() {
    const {sayg, setSayg, saveDataAndGetId} = useSayg();
    const {setEditScore} = useEditableSayg();
    const location = useLocation();
    const navigate = useNavigate();
    const query: URLSearchParams = new URLSearchParams(location.search);

    async function restart() {
        const newSayg: UpdateRecordedScoreAsYouGoDto = Object.assign({}, sayg);
        newSayg.legs = {};
        newSayg.homeScore = 0;
        newSayg.awayScore = 0;
        await setSayg(newSayg);
        await setEditScore(null);
    }

    function setQueryString(newQuery: URLSearchParams, key: string, value: string) {
        if (value) {
            newQuery.set(key, value);
        } else {
            newQuery.delete(key);
        }
    }

    function setQueryNumber(newQuery: URLSearchParams, key: string, value: number) {
        if (!Number.isNaN(value)) {
            newQuery.set(key, value.toString());
        } else {
            newQuery.delete(key);
        }
    }

    async function updateQueryParameters(newSayg: UpdateRecordedScoreAsYouGoDto) {
        const newQuery: URLSearchParams = new URLSearchParams();
        for (let entry of query.entries()) {
            newQuery.set(entry[0], entry[1]);
        }
        setQueryString(newQuery, 'yourName', newSayg.yourName);
        setQueryString(newQuery, 'opponentName', newSayg.opponentName);
        setQueryNumber(newQuery, 'startingScore', newSayg.startingScore);
        setQueryNumber(newQuery, 'numberOfLegs', newSayg.numberOfLegs);

        const to: string = '/practice?' + newQuery + location.hash;
        navigate(to);

        await setSayg(newSayg);
    }

    return (<>
        <div className="input-group my-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Number of legs</span>
            </div>
            <input type="number" className="form-control" name="numberOfLegs" value={sayg.numberOfLegs}
                   onChange={valueChanged(sayg, updateQueryParameters)}/>
            <div className="input-group-prepend">
                <span className="input-group-text">Starting score</span>
            </div>
            <input type="number" className="form-control" name="startingScore" value={sayg.startingScore}
                   onChange={valueChanged(sayg, updateQueryParameters)}/>
            <ShareButton text="Practice" getHash={saveDataAndGetId} title="Practice" buttonText="Save "/>
        </div>
        <div className="input-group my-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Your name</span>
            </div>
            <input className="form-control" value={sayg.yourName} name="yourName"
                   onChange={valueChanged(sayg, updateQueryParameters)}/>
            <div className="input-group-prepend">
                <span className="input-group-text">Opponent</span>
            </div>
            <input placeholder="Optional" className="form-control" name="opponentName"
                   value={sayg.opponentName || ''} onChange={valueChanged(sayg, updateQueryParameters)}/>
            <button className="btn btn-primary" onClick={restart}>Restart...</button>
        </div>
    </>);
}