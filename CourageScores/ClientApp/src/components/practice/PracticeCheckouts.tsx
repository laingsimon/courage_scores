import { useApp } from '../common/AppContainer';
import { useLocation, useNavigate } from 'react-router';
import { stateChanged } from '../../helpers/events';
import { useEffect, useState } from 'react';

interface ILeg {
    attempts: boolean[];
}

export function PracticeCheckouts() {
    const DEFAULT_INITIAL_SCORE = 100;
    const DEFAULT_ATTEMPTS = 3;
    const DEFAULT_UP = 5;
    const DEFAULT_DOWN = 1;

    const { fullScreen } = useApp();
    const location = useLocation();
    const navigate = useNavigate();
    const search = new URLSearchParams(location.search);
    const [legs, setLegs] = useState<ILeg[]>(createInitialState());

    useEffect(() => {
        window.setTimeout(scrollToLastScore, 10);
    }, [legs]);

    function scrollToLastScore() {
        const lastLeg = document.querySelector(
            '[datatype="legs"] > li:last-child',
        );
        lastLeg?.scrollIntoView();
    }

    function changeParam(name: string) {
        return (value: string) => {
            const newSearch = new URLSearchParams(location.search);
            if (!value) {
                newSearch.delete(name);
            } else {
                newSearch.set(name, value);
            }
            navigate(location.pathname + '?' + newSearch.toString());
        };
    }

    function getIntParam(name: string, defaultValue: number): number {
        const value = search.get(name);
        if (!value) {
            return defaultValue;
        }
        const num = Number.parseInt(value);
        return Number.isNaN(num) ? defaultValue : num;
    }

    function createInitialState() {
        return [{ attempts: [] }];
    }

    function addAttempt(outcome: boolean) {
        const updatedLegs = legs.concat([]);
        const currentLeg = updatedLegs[legs.length - 1];
        currentLeg.attempts.push(outcome);
        const maxAttempts = getIntParam('attempts', DEFAULT_ATTEMPTS);
        if (outcome || currentLeg.attempts.length >= maxAttempts) {
            updatedLegs.push({ attempts: [] });
        }

        setLegs(updatedLegs);
    }

    function renderLeg(
        index: number,
        score: { score: number },
        leg: ILeg,
        editable?: boolean,
        recordResults?: boolean,
    ) {
        const possibleAttempts = leg.attempts;
        const success = possibleAttempts.includes(true);
        const renderAttempts = success
            ? possibleAttempts.slice(0, possibleAttempts.indexOf(true) + 1)
            : possibleAttempts;
        const thisScore = score.score;
        if (success) {
            score.score += getIntParam('up', DEFAULT_UP);
        } else {
            score.score -= getIntParam('down', DEFAULT_DOWN);
        }

        return (
            <li
                key={index}
                className="d-flex flex-row justify-content-between my-1">
                <div className="text-center max-width-100">
                    {editable ? (
                        <input
                            type="number"
                            value={getIntParam(
                                'initial',
                                DEFAULT_INITIAL_SCORE,
                            )}
                            name="initial"
                            min="2"
                            max="501"
                            className="form-control fs-1 no-spinner width-75 p-0"
                            onChange={stateChanged(changeParam('initial'))}
                        />
                    ) : (
                        <div className="fs-1">{thisScore}</div>
                    )}
                </div>
                <div className="flex-grow-1 fs-1 no-wrap text-end">
                    {renderAttempts.map((attempt: boolean, index: number) => {
                        return (
                            <button
                                className="btn btn-outline-secondary mx-1 border-white"
                                disabled={true}
                                key={index}>
                                {attempt ? '✅' : '❌'}
                            </button>
                        );
                    })}
                    {recordResults ? (
                        <>
                            <button
                                className="btn btn-outline-danger mx-1"
                                onClick={() => addAttempt(false)}>
                                ✖️
                            </button>
                            <button
                                className="btn btn-outline-success mx-1"
                                onClick={() => addAttempt(true)}>
                                ✔️
                            </button>
                        </>
                    ) : null}
                </div>
            </li>
        );
    }

    const nextScore = {
        score: getIntParam('initial', DEFAULT_INITIAL_SCORE),
    };
    return (
        <div className="p-3 ps-0 content-background d-flex flex-column justify-content-stretch">
            <h2 className="text-center">
                Checkouts
                <button
                    className="btn btn-primary float-end"
                    onClick={() => fullScreen.toggleFullScreen()}>
                    🔎
                </button>
            </h2>
            <div className="d-flex flex-row">
                <div className="d-flex flex-row flex-grow-1 max-height-250 overflow-y-auto">
                    <ul datatype="legs" className="flex-grow-1">
                        {legs.map((leg, index) => {
                            return renderLeg(
                                index,
                                nextScore,
                                leg,
                                index === 0,
                                index === legs.length - 1,
                            );
                        })}
                    </ul>
                </div>
                <div className="d-flex flex-column">
                    <div className="d-flex flex-row justify-content-end">
                        <div className="py-2 pe-2 fs-3 text-success">+</div>
                        <input
                            type="number"
                            value={getIntParam('up', Number.NaN)}
                            placeholder={DEFAULT_UP.toString()}
                            name="up"
                            pattern="\d*"
                            min="1"
                            className="form-control width-50 fs-3 bg-success-subtle pe-0"
                            onChange={stateChanged(changeParam('up'))}
                        />
                    </div>
                    <div className="d-flex flex-row justify-content-end">
                        <div className="py-2 pe-2 fs-3 text-danger">-</div>
                        <input
                            type="number"
                            value={getIntParam('down', Number.NaN)}
                            min="1"
                            pattern="\d*"
                            placeholder={DEFAULT_DOWN.toString()}
                            name="down"
                            className="form-control width-50 fs-3 bg-danger-subtle pe-0"
                            onChange={stateChanged(changeParam('down'))}
                        />
                    </div>
                    <div className="d-flex flex-row justify-items-end">
                        <div className="py-2 pe-2 fs-3">#</div>
                        <input
                            type="number"
                            value={getIntParam('attempts', Number.NaN)}
                            name="attempts"
                            pattern="\d*"
                            min="1"
                            placeholder={DEFAULT_ATTEMPTS.toString()}
                            className="form-control width-50 fs-3 d-block pe-0"
                            onChange={stateChanged(changeParam('attempts'))}
                        />
                    </div>
                    <div className="d-flex justify-content-end py-2">
                        <button
                            className="btn btn-primary me-1"
                            onClick={() => setLegs(createInitialState())}>
                            🔄️
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
