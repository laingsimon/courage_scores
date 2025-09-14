import { useApp } from '../../common/AppContainer';
import { renderDate } from '../../../helpers/rendering';
import { TournamentMatchDto } from '../../../interfaces/models/dtos/Game/TournamentMatchDto';
import { PatchTournamentDto } from '../../../interfaces/models/dtos/Game/PatchTournamentDto';
import { PatchTournamentRoundDto } from '../../../interfaces/models/dtos/Game/PatchTournamentRoundDto';
import { propChanged, valueChanged } from '../../../helpers/events';
import {
    BootstrapDropdown,
    IBootstrapDropdownItem,
} from '../../common/BootstrapDropdown';
import { TournamentGameDto } from '../../../interfaces/models/dtos/Game/TournamentGameDto';
import { TeamDto } from '../../../interfaces/models/dtos/Team/TeamDto';
import { UntypedPromise } from '../../../interfaces/UntypedPromise';
import { useState } from 'react';
import { createTemporaryId } from '../../../helpers/projection';
import { any, count } from '../../../helpers/collections';
import { useTournament } from '../TournamentContainer';
import { getTeamsInSeason } from '../../../helpers/teams';
import {
    EditSuperleagueMatch,
    IEditSuperleagueMatchProps,
} from './EditSuperleagueMatch';
import {
    hasPlayerCount,
    matchPlayerFilter,
} from '../../../helpers/superleague';
import { GameMatchOptionDto } from '../../../interfaces/models/dtos/Game/GameMatchOptionDto';

export interface IMasterDrawProps {
    patchData?(
        patch: PatchTournamentDto | PatchTournamentRoundDto,
        nestInRound?: boolean,
        saygId?: string,
    ): Promise<boolean>;
    readOnly?: boolean;
    tournamentData: TournamentGameDto;
    setTournamentData(
        newData: TournamentGameDto,
        save?: boolean,
    ): UntypedPromise;
    kioskMode?: boolean;
}

export function MasterDraw({
    patchData,
    readOnly,
    tournamentData,
    setTournamentData,
    kioskMode,
}: IMasterDrawProps) {
    const { onError, teams } = useApp();
    const { matchOptionDefaults: singlesMatchOptionDefaults } = useTournament();
    const [newSinglesMatch, setNewSinglesMatch] = useState(getEmptyMatch());
    const [newPairsMatch, setNewPairsMatch] = useState(getEmptyMatch());
    const genderOptions: IBootstrapDropdownItem[] = [
        { text: 'Men', value: 'men' },
        { text: 'Women', value: 'women' },
    ];
    const pairsMatchOptionDefaults: GameMatchOptionDto = {
        numberOfLegs: 5,
    };
    const teamOptions = getTeamsInSeason(teams, tournamentData.seasonId).map(
        (t: TeamDto): IBootstrapDropdownItem => {
            return {
                text: t.name,
                value: t.name,
            };
        },
    );

    async function updateAndSaveTournamentData(data: TournamentGameDto) {
        await setTournamentData(data, true);
    }

    async function setMatch(update: TournamentMatchDto, index: number) {
        const newRound = Object.assign({}, tournamentData.round!);
        newRound.matches = tournamentData.round!.matches!.map((m, i) =>
            i === index ? update : m,
        );
        const newData = Object.assign({}, tournamentData);
        newData.round = newRound;

        await setTournamentData(newData, true);
    }

    async function deleteMatch(index: number) {
        if (!confirm('Are you sure you want to remove this match?')) {
            return;
        }

        const newRound = Object.assign({}, tournamentData.round!);
        newRound.matches = tournamentData.round!.matches!.filter(
            (_, i) => i !== index,
        );
        newRound.matchOptions = tournamentData.round!.matchOptions!.filter(
            (_, i) => i !== index,
        );
        const newData = Object.assign({}, tournamentData);
        newData.round = newRound;

        await setTournamentData(newData, true);
    }

    function getEmptyMatch(): TournamentMatchDto {
        return {
            id: createTemporaryId(),
            sideA: { id: createTemporaryId(), players: [] },
            sideB: { id: createTemporaryId(), players: [] },
        };
    }

    function updateNewMatch(
        players: number,
        set: (newMatch: TournamentMatchDto) => void,
        matchOptionDefaults?: GameMatchOptionDto,
    ): (update: TournamentMatchDto) => UntypedPromise {
        return async (update: TournamentMatchDto) => {
            if (
                count(update.sideA?.players) === players &&
                count(update.sideB?.players) === players
            ) {
                const newRound = Object.assign({}, tournamentData.round!);
                newRound.matches = (tournamentData.round?.matches || []).concat(
                    update,
                );
                const newData = Object.assign({}, tournamentData);
                newRound.matchOptions = matchOptionDefaults
                    ? (newRound.matchOptions || []).concat(matchOptionDefaults)
                    : newRound.matchOptions || [];
                newData.round = newRound;

                await setTournamentData(newData, true);
                set(getEmptyMatch());
            } else {
                set(update);
            }
        };
    }

    function renderMatches(
        requiredPlayerCount: number,
        numberOfLegs: number,
        newMatch: TournamentMatchDto,
        setNewMatch: (match: TournamentMatchDto) => UntypedPromise,
        props?: Partial<IEditSuperleagueMatchProps>,
    ) {
        let matchNo: number = 0;

        return (
            <tbody>
                {tournamentData.round?.matches!.map(
                    (match: TournamentMatchDto, index: number) => {
                        if (!hasPlayerCount(match, requiredPlayerCount)) {
                            return null;
                        }

                        return (
                            <EditSuperleagueMatch
                                key={match.id}
                                index={index}
                                match={match}
                                setMatchData={async (update) =>
                                    await setMatch(update, index)
                                }
                                readOnly={readOnly}
                                tournamentData={tournamentData}
                                patchData={patchData}
                                deleteMatch={async () =>
                                    await deleteMatch(index)
                                }
                                matchNumber={++matchNo}
                                playerCount={requiredPlayerCount}
                                numberOfLegs={numberOfLegs}
                                {...props}
                            />
                        );
                    },
                )}
                {readOnly ? null : (
                    <EditSuperleagueMatch
                        match={newMatch}
                        setMatchData={setNewMatch}
                        tournamentData={tournamentData}
                        newMatch={true}
                        numberOfLegs={numberOfLegs}
                        playerCount={requiredPlayerCount}
                        {...props}
                    />
                )}
            </tbody>
        );
    }

    try {
        return (
            <div className="page-break-after" datatype="master-draw">
                <h2>Master draw</h2>
                <div className="d-flex flex-row">
                    <div>
                        <table className="table" data-type="singles">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th datatype="host">
                                        {readOnly ||
                                        any(tournamentData.round?.matches) ? (
                                            tournamentData.host
                                        ) : (
                                            <BootstrapDropdown
                                                value={tournamentData.host}
                                                onChange={propChanged(
                                                    tournamentData,
                                                    updateAndSaveTournamentData,
                                                    'host',
                                                )}
                                                options={teamOptions.filter(
                                                    (to) =>
                                                        to.value !==
                                                        tournamentData.opponent,
                                                )}
                                            />
                                        )}
                                    </th>
                                    <th>v</th>
                                    <th datatype="opponent">
                                        {readOnly ||
                                        any(tournamentData.round?.matches) ? (
                                            tournamentData.opponent
                                        ) : (
                                            <BootstrapDropdown
                                                value={tournamentData.opponent}
                                                onChange={propChanged(
                                                    tournamentData,
                                                    updateAndSaveTournamentData,
                                                    'opponent',
                                                )}
                                                options={teamOptions.filter(
                                                    (to) =>
                                                        to.value !==
                                                        tournamentData.host,
                                                )}
                                            />
                                        )}
                                    </th>
                                    <th className="d-print-none"></th>
                                </tr>
                            </thead>
                            {renderMatches(
                                1,
                                tournamentData.bestOf ?? 7,
                                newSinglesMatch,
                                updateNewMatch(
                                    1,
                                    setNewSinglesMatch,
                                    singlesMatchOptionDefaults,
                                ),
                            )}
                        </table>

                        {!readOnly ||
                        any(
                            tournamentData.round?.matches,
                            matchPlayerFilter(2),
                        ) ? (
                            <>
                                <h3>Pairs</h3>
                                <table className="table" data-type="pairs">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>{tournamentData.host}</th>
                                            <th>v</th>
                                            <th>{tournamentData.opponent}</th>
                                            <th className="d-print-none"></th>
                                        </tr>
                                    </thead>
                                    {renderMatches(
                                        2,
                                        pairsMatchOptionDefaults.numberOfLegs!,
                                        newPairsMatch,
                                        updateNewMatch(
                                            2,
                                            setNewPairsMatch,
                                            pairsMatchOptionDefaults,
                                        ),
                                        {
                                            showFullNames: true,
                                            useFirstNameOnly: true,
                                        },
                                    )}
                                </table>
                            </>
                        ) : null}
                    </div>
                    {kioskMode ? null : (
                        <div className="px-5" datatype="details">
                            <div datatype="gender">
                                {!readOnly ? (
                                    <BootstrapDropdown
                                        value={tournamentData.gender}
                                        onChange={propChanged(
                                            tournamentData,
                                            updateAndSaveTournamentData,
                                            'gender',
                                        )}
                                        options={genderOptions}
                                    />
                                ) : (
                                    <span className="fw-bold">
                                        Gender: {tournamentData.gender}
                                    </span>
                                )}
                            </div>
                            <div>
                                Date:{' '}
                                <span className="fw-bold">
                                    {renderDate(tournamentData.date)}
                                </span>
                            </div>
                            {tournamentData.type || !readOnly ? (
                                <div datatype="type">
                                    {!readOnly ? (
                                        <input
                                            value={tournamentData.type || ''}
                                            name="type"
                                            className="form-control"
                                            placeholder="e.g. Board #"
                                            onChange={valueChanged(
                                                tournamentData,
                                                setTournamentData,
                                            )}
                                            onBlur={() =>
                                                setTournamentData(
                                                    tournamentData,
                                                    true,
                                                )
                                            }
                                        />
                                    ) : (
                                        <span className="fw-bold">
                                            Notes: {tournamentData.type}
                                        </span>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        );
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
