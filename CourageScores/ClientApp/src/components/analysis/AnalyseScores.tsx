import {useLocation, useNavigate, useParams} from "react-router";
import {useEffect, useState} from "react";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {
    DivisionTournamentFixtureDetailsDto
} from "../../interfaces/models/dtos/Division/DivisionTournamentFixtureDetailsDto";
import {any, isEmpty} from "../../helpers/collections";
import {renderDate} from "../../helpers/rendering";
import {useDependencies} from "../common/IocContainer";
import {useApp} from "../common/AppContainer";
import {AnalysisResponseDto} from "../../interfaces/models/dtos/Analysis/AnalysisResponseDto";
import {NamedBreakdownDto} from "../../interfaces/models/dtos/Analysis/NamedBreakdownDto";
import {ScoreBreakdownDto} from "../../interfaces/models/dtos/Analysis/ScoreBreakdownDto";

interface IBreakdown {
    [team: string]: (ScoreBreakdownDto | NamedBreakdownDto)[]
}

export function AnalyseScores() {
    const {season: requestedSeason} = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const {divisionApi, saygApi} = useDependencies();
    const {seasons} = useApp();
    const [ analysing, setAnalysing ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);
    const [ tournaments, setTournaments ] = useState<DivisionTournamentFixtureDetailsDto[]>([]);
    const [ error, setError ] = useState<string | null>(null);
    const [ analysis, setAnalysis ] = useState<AnalysisResponseDto | null>(null);
    const search = new URLSearchParams(location.search);
    const filteredTeams: string[] = search.getAll('team');
    const filteredAnalyses: string[] = search.getAll('a');

    useEffect(() => {
        /* istanbul ignore next */
        if (loading || any(tournaments)) {
            /* istanbul ignore next */
            return;
        }

        // noinspection JSIgnoredPromiseFromCall
        loadFixtures();
    }, []);

    useEffect(() => {
        /* istanbul ignore next */
        if (any(tournaments)) {
            /* istanbul ignore next */
            return;
        }

        setLoading(false);

        // noinspection JSIgnoredPromiseFromCall
        loadFixtures();
    }, [requestedSeason, seasons]);
    
    async function loadFixtures() {
        /* istanbul ignore next */
        if (loading || isEmpty(seasons)) {
            /* istanbul ignore next */
            return;
        }

        setLoading(true);

        try {
            const season = seasons.filter(s => s.name === requestedSeason || s.id === requestedSeason)[0];

            if (!season) {
                setError(`Could not find season with name: ${requestedSeason}`);
                return;
            }

            setError(null);

            // load fixtures from an api
            const divisionData = await divisionApi.data({
                excludeProposals: true,
                seasonId: season.id,
            });

            if (any(divisionData.dataErrors)) {
                setError(divisionData.dataErrors!.map(de => de.message).join(', '));
            }

            const allTournamentFixtures: DivisionTournamentFixtureDetailsDto[] = divisionData.fixtures!
                .flatMap(fd => fd.tournamentFixtures!);
            setTournaments(allTournamentFixtures);
        }
        finally {
            setLoading(false);
        }
    }

    async function toggleTournament(id: string) {
        const newSearch = new URLSearchParams(location.search);
        if (isSelected(id)) {
            newSearch.delete('t', id);
        } else {
            newSearch.append('t', id);
        }

        const newQuery: string = '?' + newSearch.toString();
        navigate(`/analyse/${requestedSeason}/${newQuery === '?' ? '' : newQuery}`)
    }

    async function toggleTeam(team: string) {
        const newSearch = new URLSearchParams(location.search);
        if (includeTeam(team)) {
            newSearch.delete('team', team);
        } else {
            newSearch.append('team', team);
        }

        const newQuery: string = '?' + newSearch.toString();
        navigate(`/analyse/${requestedSeason}/${newQuery === '?' ? '' : newQuery}`)
    }

    async function toggleAnalysis(key: string) {
        const newSearch = new URLSearchParams(location.search);
        if (includeAnalysis(key)) {
            newSearch.delete('a', key);
        } else {
            newSearch.append('a', key);
        }

        const newQuery: string = '?' + newSearch.toString();
        navigate(`/analyse/${requestedSeason}/${newQuery === '?' ? '' : newQuery}`)
    }

    function isSelected(id: string): boolean {
        const selected: string[] = search.getAll('t');
        return any(selected, t => t === id);
    }

    function includeTeam(team: string): boolean {
        return any(filteredTeams, t => t === team);
    }

    function includeAnalysis(key: string): boolean {
        return any(filteredAnalyses, a => a === key);
    }

    async function analyseScores() {
        /* istanbul ignore next */
        if (analysing) {
            /* istanbul ignore next */
            return;
        }
        const search = new URLSearchParams(location.search);
        const selected: string[] = search.getAll('t');

        if (isEmpty(selected)) {
            setError('Select some tournaments first');
            return;
        }

        setAnalysing(true);

        try {
            setAnalysis(null);
            setError(null);

            const result = await saygApi.analyse({
                // maxBreakdown: undefined,
                tournamentIds: selected
            });

            if (!result.success) {
                setError(result.errors!.concat(result.warnings!).join(', '));
            } else {
                setAnalysis(result.result!);
            }
        } finally {
            setAnalysing(false);
        }
    }

    function getBreakdownTitle(name: string): string {
        switch (name) {
            case 'MostFrequentThrows': return 'Most frequent throws';
            case 'MostFrequentPlayers': return 'Most frequent players';
            case 'HighestScores': return 'Highest scores';
        }
        return name;
    }

    function renderBreakdown(type: string, breakdown: IBreakdown) {
        function renderBreakdownDetail(detail: (ScoreBreakdownDto | NamedBreakdownDto)[]) {
            switch (type) {
                case 'MostFrequentThrows':
                    return renderScoreBreakdown(detail as ScoreBreakdownDto[]);
                case 'HighestScores':
                    return renderScoreBreakdown(detail as ScoreBreakdownDto[]);
                case 'MostFrequentPlayers':
                    return renderNamedBreakdown(detail as NamedBreakdownDto[]);
            }
        }

        return (<div key={type} className="border-1 border-solid border-secondary rounded p-2 flex-grow-1 mx-1 mb-1">
            <h5 datatype="analysis-heading" className="text-center" onClick={() => toggleAnalysis(type)}>🔎 {getBreakdownTitle(type)}</h5>
            {Object.keys(breakdown).filter(t => isEmpty(filteredTeams) || includeTeam(t)).sort().map((team: string) => {
                const detail: (ScoreBreakdownDto | NamedBreakdownDto)[] = breakdown[team];

                return <div datatype={type} key={team} className="border-1 border-solid m-1 p-1 border-secondary-subtle rounded">
                    <p datatype="team-heading" className="fw-bold m-0 text-center" onClick={() => toggleTeam(team)}>🔎 {team}</p>
                    {renderBreakdownDetail(detail)}
                </div>
            })}
        </div>)
    }

    function renderScoreBreakdown(detail: ScoreBreakdownDto[]) {
        if (isEmpty(detail)) {
            return (<p>No data</p>);
        }

        return <table className="table mb-0">
            <thead>
            <tr>
                <th>Score</th>
                <th>Times</th>
            </tr>
            </thead>
            <tbody>
            {detail.map(d => {
                return (<tr key={d.score}>
                    <td className={`${d.score! >= 100 ? 'text-danger' : ''}${d.score === 180 ? ' fw-bold' : ''}`}>{d.score}</td>
                    <td>{d.number}</td>
                </tr>)
            })}
            </tbody>
        </table>;
    }

    function renderNamedBreakdown(detail: NamedBreakdownDto[]) {
        if (isEmpty(detail)) {
            return (<p>No data</p>);
        }

        return <table className="table mb-0">
            <thead>
            <tr>
                <th>Name</th>
                <th>Times</th>
            </tr>
            </thead>
            <tbody>
            {detail.map(d => {
                return (<tr key={d.name}>
                    <td>{d.name}</td>
                    <td>{d.value}</td>
                </tr>)
            })}
            </tbody>
        </table>;
    }

    return <div className="content-background p-3">
        <h2>Analyse scores</h2>
        <p>Select tournaments</p>
        {error ? <div className="alert alert-danger">{error}</div> : null}
        <div className="list-group mb-2 overflow-auto max-height-200">
            {loading ? <LoadingSpinnerSmall /> : null}
            {!loading ? tournaments.map(t => {
                return (<div className={`list-group-item${isSelected(t.id!) ? ' active' : ''}`} onClick={() => toggleTournament(t.id!)} key={t.id}>
                    {t.singleRound ? 'Superleague' : 'Tournament'}: {renderDate(t.date)} {t.type} vs {t.opponent}
                </div>)
            }) : null}
        </div>
        <button className="btn btn-primary" onClick={() => analyseScores()}>
            {analysing ? <LoadingSpinnerSmall /> : null}
            Analyse
        </button>
        {filteredTeams.map(team => {
            return (<button key={team} onClick={() => toggleTeam(team)} className="btn btn-outline-danger ms-2">❌ {team}</button>)
        })}
        {filteredAnalyses.map(type => {
            return (<button key={type} onClick={() => toggleAnalysis(type)} className="btn btn-outline-danger ms-2">❌ {getBreakdownTitle(type)}</button>)
        })}
        {!analysing && analysis ? (<div className="mt-3 d-flex flex-wrap flex-row justify-content-stretch">
            {Object.keys(analysis).filter(key => isEmpty(filteredAnalyses) || any(filteredAnalyses, a => a === key)).map((key: string) => {
                return renderBreakdown(key, analysis[key]);
            })}
        </div>) : null}
    </div>
}
