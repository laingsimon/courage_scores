import {NumberKeyboard} from "../common/NumberKeyboard";

export interface IPlayerInputProps {
    score: string;
    setScore(score: string): Promise<any>;
    handleScore(score: string): Promise<any>;
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
