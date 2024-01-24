import React, {createContext, useContext, useEffect, useState} from "react";
import {useDependencies} from "../../../IocContainer";
import {useApp} from "../../../AppContainer";
import {Loading} from "../../common/Loading";
import {ErrorDisplay} from "../../common/ErrorDisplay";
import {ScoreAsYouGo} from "./ScoreAsYouGo";
import {isEmpty} from "../../../helpers/collections";
import {LiveContainer} from "../LiveContainer";
import {IBaseSayg, ISayg} from "../../../interfaces/ISayg";
import {IRecordedScoreAsYouGoDto} from "../../../interfaces/serverSide/Game/Sayg/IRecordedScoreAsYouGoDto";
import {IClientActionResultDto} from "../../../interfaces/IClientActionResultDto";
import {ILiveOptions} from "../../../interfaces/ILiveOptions";

const SaygContext = createContext({});

export function useSayg(): ISayg {
    return useContext(SaygContext) as ISayg;
}

export interface ISaygLoadingContainerProps extends IBaseSayg {
    children?: React.ReactNode;
    id: string;
    defaultData?: ILoadedScoreAsYouGoDto;
    autoSave?: boolean;
    on180?: (sideName: string) => Promise<any>;
    onHiCheck?: (sideName: string, score: number) => Promise<any>;
    onSaved?: (data: ILoadedScoreAsYouGoDto) => Promise<any>;
    onLoadError?: (error: string) => Promise<any>;
    liveOptions: ILiveOptions;

    // for testing only
    onScoreChange?: (homeScore: number, awayScore: number) => Promise<any>;
}

export interface ILoadedScoreAsYouGoDto extends IRecordedScoreAsYouGoDto {
    lastUpdated?: string;
}

export function SaygLoadingContainer({ children, id, defaultData, autoSave, on180, onHiCheck, onScoreChange, onSaved,
                                         onLoadError, matchStatisticsOnly, lastLegDisplayOptions, liveOptions }: ISaygLoadingContainerProps) {
    const [sayg, setSayg] = useState<ILoadedScoreAsYouGoDto>(defaultData);
    const [saveError, setSaveError] = useState<IClientActionResultDto<ILoadedScoreAsYouGoDto> | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const {saygApi, webSocket} = useDependencies();
    const {onError} = useApp();

    useEffect(() => {
            if (loading) {
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

            const sayg: ILoadedScoreAsYouGoDto = await saygApi.get(id);

            if (!sayg || !sayg.legs) {
                if (onLoadError) {
                    await onLoadError('Data not found');
                }
                return;
            }

            sayg.lastUpdated = sayg.updated;
            setSayg(sayg);
            return sayg;
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setLoading(false);
        }
    }

    async function saveDataAndGetId(useData?: ILoadedScoreAsYouGoDto) {
        try {
            const response: IClientActionResultDto<ILoadedScoreAsYouGoDto> = await saygApi.upsert(useData || sayg);
            if (response.success) {
                response.result.lastUpdated = response.result.updated;
                setSayg(response.result);

                if (onSaved) {
                    await onSaved(response.result);
                }

                return '#' + response.result.id;
            } else {
                setSaveError(response);
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }

        return null;
    }

    async function onChange(newData: ILoadedScoreAsYouGoDto) {
        const newSayg = await updateSayg(newData);

        if (!autoSave) {
            return;
        }

        if (!newData.legs['0']) {
            return;
        }

        if (!sayg.legs['0'] || isEmpty(sayg.legs['0'].playerSequence || [])) {
            await saveDataAndGetId(newSayg);
        }
    }

    async function updateSayg(newData: IRecordedScoreAsYouGoDto): Promise<ILoadedScoreAsYouGoDto> {
        const newSayg = Object.assign({}, sayg, newData);
        setSayg(newSayg);
        if (liveOptions.publish) {
            await webSocket.publish(id, newSayg);
        }
        return newSayg;
    }

    if (loading) {
        return (<Loading/>);
    }

    const saygProps: ISayg = {
        sayg,
        setSayg: updateSayg,
        saveDataAndGetId,
        matchStatisticsOnly,
        lastLegDisplayOptions,
    };

    try {
        return (<LiveContainer liveOptions={liveOptions} onDataUpdate={async (data: ILoadedScoreAsYouGoDto) => setSayg(data)}>
            <SaygContext.Provider value={saygProps}>
                {saveError ? (
                    <ErrorDisplay {...saveError} onClose={async () => setSaveError(null)} title="Could not save data"/>) : null}
                {sayg ? (<div>
                    {children}
                    <ScoreAsYouGo
                        startingScore={sayg.startingScore}
                        numberOfLegs={sayg.numberOfLegs}
                        onHiCheck={onHiCheck}
                        on180={on180}
                        onChange={onChange}
                        homeScore={sayg.homeScore}
                        awayScore={sayg.awayScore}
                        away={sayg.opponentName}
                        home={sayg.yourName}
                        data={sayg}
                        singlePlayer={!sayg.opponentName}
                        onLegComplete={async (homeScore: number, awayScore: number) => {
                            const sayg = await updateSayg({homeScore, awayScore} as any);
                            if (autoSave) {
                                await saveDataAndGetId(sayg);
                            }
                            if (onScoreChange) {
                                await onScoreChange(homeScore, awayScore);
                            }
                        }}/>
                </div>) : null}
            </SaygContext.Provider>
        </LiveContainer>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}