import React, {createContext, useContext, useEffect, useState} from "react";
import {useDependencies} from "../common/IocContainer";
import {useApp} from "../common/AppContainer";
import {Loading} from "../common/Loading";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {ScoreAsYouGo} from "./ScoreAsYouGo";
import {LiveContainer} from "../../live/LiveContainer";
import {ISayg} from "./ISayg";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {ILiveOptions} from "../../live/ILiveOptions";
import {UpdateRecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";
import {LiveDataType} from "../../interfaces/models/dtos/Live/LiveDataType";
import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";
import {EditableSaygContainer} from "./EditableSaygContainer";
import {ILegDisplayOptions} from "./ILegDisplayOptions";
import {UntypedPromise} from "../../interfaces/UntypedPromise";
import {isLegWinner} from "../../helpers/superleague";

const SaygContext = createContext({});

export function useSayg(): ISayg {
    return useContext(SaygContext) as ISayg;
}

export interface ISaygLoadingContainerProps {
    children?: React.ReactNode;
    id: string;
    defaultData?: ILoadedScoreAsYouGoDto;
    autoSave?: boolean;
    on180?(sideName: string): UntypedPromise;
    onHiCheck?(sideName: string, score: number): UntypedPromise;
    onSaved?(data: ILoadedScoreAsYouGoDto): UntypedPromise;
    onLoadError?(error: string): UntypedPromise;
    liveOptions: ILiveOptions;
    matchStatisticsOnly?: boolean;
    lastLegDisplayOptions?: ILegDisplayOptions;
    firstLegPlayerSequence?: ('home' | 'away')[];
    finalLegPlayerSequence?: ('home' | 'away')[];
    onFinished?(): UntypedPromise;

    // for testing only
    onScoreChange?(homeScore: number, awayScore: number): UntypedPromise;
}

export interface ILoadedScoreAsYouGoDto extends UpdateRecordedScoreAsYouGoDto {
    lastUpdated?: string;
}

export function SaygLoadingContainer({ children, id, defaultData, autoSave, on180, onHiCheck, onScoreChange, onSaved,
                                         onLoadError, matchStatisticsOnly, lastLegDisplayOptions, liveOptions,
                                        firstLegPlayerSequence, finalLegPlayerSequence, onFinished }: ISaygLoadingContainerProps) {
    const [sayg, setSayg] = useState<ILoadedScoreAsYouGoDto | undefined>(defaultData);
    const [saveError, setSaveError] = useState<IClientActionResultDto<ILoadedScoreAsYouGoDto> | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const {saygApi, webSocket} = useDependencies();
    const {onError} = useApp();

    useEffect(() => {
            /* istanbul ignore next */
            if (loading) {
                /* istanbul ignore next */
                return;
            }

            setLoading(true);
            // noinspection JSIgnoredPromiseFromCall
            loadData();
        },
        // eslint-disable-next-line
        []);

    async function loadData() {
        try {
            if (!id) {
                setSayg(defaultData);
                return;
            }

            const saygData: ILoadedScoreAsYouGoDto | null = await saygApi.get(id);

            if (!saygData || !saygData.legs) {
                if (onLoadError) {
                    await onLoadError('Data not found');
                }
                return;
            }

            saygData.lastUpdated = saygData.updated;
            if (liveOptions.publish && !sayg) {
                // first load and updates will be published, send an empty publication so the match appears in the TV connections list
                await webSocket.publish(id, LiveDataType.sayg, saygData);
            }

            setSayg(saygData);

            return saygData;
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setLoading(false);
        }
    }

    async function saveDataAndGetId(useData?: UpdateRecordedScoreAsYouGoDto): Promise<string | undefined> {
        try {
            const response: IClientActionResultDto<ILoadedScoreAsYouGoDto> = await saygApi.upsert(useData || sayg!);
            if (response.success) {
                response.result!.lastUpdated = response.result!.updated;
                setSayg(response.result);

                if (onSaved) {
                    await onSaved(response.result!);
                }

                return '#' + response.result!.id;
            } else {
                setSaveError(response);
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }

        return undefined;
    }

    async function onChange(newData: ILoadedScoreAsYouGoDto) {
        const newSayg: ILoadedScoreAsYouGoDto = await updateSayg(newData);

        if (!autoSave) {
            return;
        }

        const newFirstLeg: LegDto = newData.legs[0];
        const oldFirstLeg: LegDto = sayg!.legs[0];
        const newLastLeg: LegDto = newData.legs[Object.keys(newData.legs).length - 1];
        const oldLastLeg: LegDto = sayg!.legs[Object.keys(sayg!.legs).length - 1];
        const newLastLegHasWinner: boolean = newLastLeg && (isLegWinner(newLastLeg, 'home') || isLegWinner(newLastLeg, 'away'));
        const oldLastLegHasWinner: boolean = oldLastLeg && (isLegWinner(oldLastLeg, 'home') || isLegWinner(oldLastLeg, 'away'));

        if ((newFirstLeg && !oldFirstLeg && newFirstLeg.currentThrow)
            || (newLastLeg && oldLastLeg && newLastLegHasWinner && !oldLastLegHasWinner)
            || (newLastLeg && oldLastLeg && newLastLeg.currentThrow && !oldLastLeg.currentThrow)) {
            await saveDataAndGetId(newSayg);
        }
    }

    async function updateSayg(newData: UpdateRecordedScoreAsYouGoDto): Promise<UpdateRecordedScoreAsYouGoDto> {
        const newSayg: UpdateRecordedScoreAsYouGoDto = Object.assign({}, sayg, newData);
        setSayg(newSayg);
        if (liveOptions.publish) {
            if (!await webSocket.publish(id, LiveDataType.sayg, newSayg)) {
                window.alert('Unable to publish updated data');
            }
        }
        return newSayg;
    }

    if (loading) {
        return (<Loading/>);
    }

    const saygProps: ISayg = {
        sayg: sayg!,
        setSayg: updateSayg,
        saveDataAndGetId,
    };

    try {
        return (<LiveContainer liveOptions={liveOptions} onDataUpdate={async (data: ILoadedScoreAsYouGoDto) => setSayg(data)}>
            <EditableSaygContainer>
            <SaygContext.Provider value={saygProps}>
                {saveError ? (
                    <ErrorDisplay {...saveError} onClose={async () => setSaveError(null)} title="Could not save data"/>) : null}
                {sayg ? (<div>
                    {children}
                    <ScoreAsYouGo
                        startingScore={sayg.startingScore || 0}
                        numberOfLegs={sayg.numberOfLegs || 0}
                        onHiCheck={onHiCheck!}
                        on180={on180!}
                        onChange={onChange}
                        homeScore={sayg.homeScore}
                        awayScore={sayg.awayScore}
                        away={sayg.opponentName}
                        home={sayg.yourName || ''}
                        data={sayg}
                        singlePlayer={!sayg.opponentName}
                        onLegComplete={async (homeScore: number, awayScore: number) => {
                            const sayg = await updateSayg({homeScore, awayScore} as UpdateRecordedScoreAsYouGoDto);
                            if (autoSave) {
                                await saveDataAndGetId(sayg);
                            }
                            if (onScoreChange) {
                                await onScoreChange(homeScore, awayScore);
                            }
                        }}
                        lastLegDisplayOptions={lastLegDisplayOptions}
                        matchStatisticsOnly={matchStatisticsOnly}
                        saveDataAndGetId={saveDataAndGetId}
                        firstLegPlayerSequence={firstLegPlayerSequence}
                        finalLegPlayerSequence={finalLegPlayerSequence}
                        onFinished={onFinished}
                    />
                </div>) : null}
            </SaygContext.Provider>
            </EditableSaygContainer>
        </LiveContainer>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}