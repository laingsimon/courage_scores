import {useApp} from "../../../AppContainer";
import {any, distinct, sortBy} from "../../../helpers/collections";
import {BootstrapDropdown} from "../../common/BootstrapDropdown";

export function AssignPlaceholders({ seasonId, selectedTemplate, placeholderMappings, setPlaceholderMappings }) {
    const {divisions, seasons, teams} = useApp();
    const season = seasons[seasonId];
    const applicableDivisions = divisions.filter(division => any(season.divisions, d => d.id === division.id));
    const template = selectedTemplate.result;
    const templateSharedAddresses = template.sharedAddresses.flatMap(a => a);

    function getPlaceholdersForTemplateDivision(templateDivision) {
        return distinct(templateDivision.dates.flatMap(d => d.fixtures.flatMap(f => [ f.home, f.away ]).filter(placeholder => placeholder)));
    }

    function getTeamsWithUniqueAddresses(division) {
        const teamsInDivision = teams.filter(t => any(t.seasons, ts => ts.seasonId === seasonId && ts.divisionId === division.id));
        const addressCounts = {};
        teamsInDivision.forEach(team => {
            if (addressCounts[team.address] === undefined) {
                addressCounts[team.address] = 1;
            } else {
                addressCounts[team.address]++;
            }
        })
        return [{ value: '', text: '🎲 Randomly assign' }].concat(teamsInDivision.sort(sortBy('name')).map(t => {
            const hasUniqueAddress = addressCounts[t.address] === 1;
            const text = hasUniqueAddress
                ? t.name
                : `🚫 ${t.name} (has shared address)`;

            return { value: t.id, text: text, disabled: !hasUniqueAddress };
        }));
    }

    function setSelectedPlaceholder(teamId, placeholder) {
        const newMappings = Object.assign({}, placeholderMappings);
        if (teamId) {
            newMappings[placeholder] = teamId;
        } else {
            delete newMappings[placeholder];
        }
        setPlaceholderMappings(newMappings);
    }

    return (<div>
        {applicableDivisions.sort(sortBy('name')).map((division, index) => {
            const templateDivision = template.divisions[index];
            const templatePlaceholders = getPlaceholdersForTemplateDivision(templateDivision);
            const availableTeams = getTeamsWithUniqueAddresses(division);

            return (<div key={division.id}>
                <h6>{division.name}</h6>
                <ul>
                    {templatePlaceholders.sort().map(placeholder => {
                        const hasDivisionSharedAddress = any(templateDivision.sharedAddresses.flatMap(a => a), a => a === placeholder);
                        const hasTemplateSharedAddress = any(templateSharedAddresses, a => a === placeholder);
                        let className = '';
                        if (hasTemplateSharedAddress) {
                            className += ' bg-warning';
                        }
                        if (hasDivisionSharedAddress) {
                            className += ' bg-secondary text-light';
                        }
                        const selectedTeamId = placeholderMappings[placeholder];
                        const availableTeamsForPlaceholder = availableTeams.filter(o => {
                            const selected = any(Object.values(placeholderMappings), t => t === o.value);
                            return !o.value || o.value === selectedTeamId || !selected;
                        });

                        return (<li key={placeholder}>
                            <span className={`width-20 d-inline-block text-center margin-right ${className}`}>{placeholder}</span>
                            {hasDivisionSharedAddress ? 'Reserved for use by team with shared address in division' : null}
                            {hasTemplateSharedAddress ? 'Reserved for use by team with shared address across divisions' : null}
                            {!hasTemplateSharedAddress && !hasDivisionSharedAddress
                                ? (<BootstrapDropdown options={availableTeamsForPlaceholder} value={selectedTeamId || ''} onChange={id => setSelectedPlaceholder(id, placeholder)} />)
                                : null}
                        </li>);
                    })}
                </ul>
            </div>)
        })}
    </div>)
}