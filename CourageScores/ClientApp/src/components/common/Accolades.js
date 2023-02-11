export function add180(fixtureData, setFixtureData) {
    return (player) => {
        const newFixtureData = Object.assign({}, fixtureData);

        if (!newFixtureData.oneEighties) {
            newFixtureData.oneEighties = [];
        }

        newFixtureData.oneEighties.push({
            id: player.id,
            name: player.name
        });

        setFixtureData(newFixtureData);
    }
}

export function remove180(fixtureData, setFixtureData) {
    return (playerId, index) => {
        const newFixtureData = Object.assign({}, fixtureData);

        newFixtureData.oneEighties.splice(index, 1);

        setFixtureData(newFixtureData);
    }
}

export function addHiCheck(fixtureData, setFixtureData) {
    return (player, notes) => {
        const newFixtureData = Object.assign({}, fixtureData);

        if (!newFixtureData.over100Checkouts) {
            newFixtureData.over100Checkouts = [];
        }

        newFixtureData.over100Checkouts.push({
            id: player.id,
            name: player.name,
            notes: notes
        });

        setFixtureData(newFixtureData);
    }
}

export function removeHiCheck(fixtureData, setFixtureData) {
    return (playerId, index) => {
        const newFixtureData = Object.assign({}, fixtureData);

        newFixtureData.over100Checkouts.splice(index, 1);

        setFixtureData(newFixtureData);
    };
}

