import {NumberKeyboard} from "../common/NumberKeyboard";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface IPlayerInputProps {
    score: string;
    setScore(score: string): UntypedPromise;
    handleScore(score: string): UntypedPromise;
}

export function PlayerInput({score, handleScore, setScore}: IPlayerInputProps) {
    return (<div className="text-center">
        <div className="d-flex flex-row justify-content-center">
            <div>
                <NumberKeyboard value={score} maxValue={180} onChange={async (score: string) => setScore(score)}
                                onEnter={handleScore}/>
            </div>
        </div>
    </div>);
}
