import {createTemporaryId} from "./projection";

/* istanbul ignore file */

export function teamBuilder(name, id) {
    const team = {
        id: id || createTemporaryId(),
        name: name,
        address: '',
        seasons: [],
    };

    const builder = {
        build: () => team,
        addTo: (map) => {
            map[team.id] = team;
            return builder;
        },
    };

    builder.forSeason = (seasonOrId, divisionOrId, players) => {
        const teamSeason = {
            seasonId: seasonOrId && seasonOrId.id ? seasonOrId.id : seasonOrId,
            divisionId: divisionOrId && divisionOrId.id ? divisionOrId.id : divisionOrId,
            players: players || [],
        };
        team.seasons.push(teamSeason);
        return builder;
    };
    builder.address = (address) => {
        team.address = address;
        return builder;
    };
    builder.season = (seasonOrId) => {
        team.seasonId = seasonOrId.id ? seasonOrId.id : seasonOrId;
        return builder;
    };
    builder.division = (divisionOrId) => {
        team.divisionId = divisionOrId.id ? divisionOrId.id : divisionOrId;
        return builder;
    };
    builder.updated = (updated) => {
        team.updated = updated;
        return builder;
    };
    builder.newDivisionId = (id) => {
        team.newDivisionId = id;
        return builder;
    };
    builder.noId = () => {
        delete team.id;
        return builder;
    };

    return builder;
}

export function fixtureBuilder(date, id, omitSubmission) {
    const fixture = {
        id: id || createTemporaryId(),
        date: date,
        oneEighties: [],
        over100Checkouts: [],
        matches: [],
        matchOptions: [],
    };

    const builder = {
        build: () => fixture,
        addTo: (map) => {
            map[fixture.id] = fixture;
            return builder;
        },
    };

    const teamFactory = (t, id) => {
        if (t === null || t === undefined) {
            return null;
        }

        if (t && t.id) {
            return t;
        }

        return {
            id: id || createTemporaryId(),
            name: t,
        };
    }

    builder.playing = (home, away) => {
        fixture.home = teamFactory(home);
        fixture.away = teamFactory(away);
        return builder;
    };
    builder.bye = (venue, id) => {
        fixture.homeTeam = teamFactory(venue, id);
        fixture.awayTeam = null;
        return builder;
    };
    builder.manOfTheMatch = (homePlayerOrId, awayPlayerOrId) => {
        if (homePlayerOrId) {
            fixture.home.manOfTheMatch = homePlayerOrId.id ? homePlayerOrId.id : homePlayerOrId;
        }
        if (awayPlayerOrId) {
            fixture.away.manOfTheMatch = awayPlayerOrId.id ? awayPlayerOrId.id : homePlayerOrId;
        }
        return builder;
    };
    builder.knockout = () => {
        fixture.isKnockout = true;
        return builder;
    };
    builder.postponed = () => {
        fixture.postponed = true;
        return builder;
    };
    builder.accoladesCount = () => {
        fixture.accoladesCount = true;
        return builder;
    };
    builder.address = (address) => {
        fixture.address = address;
        return builder;
    };
    builder.forSeason = (seasonOrId) => {
        fixture.seasonId = seasonOrId.id ? seasonOrId.id : seasonOrId;
        return builder;
    };
    builder.forDivision = (divisionOrId) => {
        fixture.divisionId = divisionOrId.id ? divisionOrId.id : divisionOrId;
        return builder;
    };
    builder.with180 = (playerOrName) => {
        fixture.oneEighties.push(!playerOrName || playerOrName.name ? playerOrName : {
            id: createTemporaryId(),
            name: playerOrName,
        });
        return builder;
    };
    builder.withHiCheck = (playerOrName, score) => {
        const player = !playerOrName || playerOrName.name ? playerOrName : {
            id: createTemporaryId(),
            name: playerOrName
        };

        fixture.over100Checkouts.push(Object.assign({}, player, { notes: score }));
        return builder;
    };
    builder.withMatch = (matchOrBuilderFunc) => {
        const match = matchOrBuilderFunc instanceof Function
            ? matchOrBuilderFunc(matchBuilder(id))
            : matchOrBuilderFunc;
        fixture.matches.push(match.build ? match.build() : match);
        return builder;
    };
    builder.withMatchOption = (matchOptionOrBuilderFunc) => {
        const matchOption = matchOptionOrBuilderFunc instanceof Function
            ? matchOptionOrBuilderFunc(matchOptionsBuilder())
            : matchOptionOrBuilderFunc;
        fixture.matchOptions.push(matchOption.build ? matchOption.build() : matchOption);
        return builder;
    };
    builder.editor = (name) => {
        fixture.editor = name;
        return builder;
    };
    builder.author = (name) => {
        fixture.author = name;
        return builder;
    };

    if (!omitSubmission) {
        // don't allow home/away submissions for home/away submissions - only at root level

        builder.homeSubmission = (submissionOrBuilderFunc, id) => {
            const submission = submissionOrBuilderFunc instanceof Function
                ? submissionOrBuilderFunc(fixtureBuilder(fixture.date, id || fixture.id, true))
                : submissionOrBuilderFunc;
            fixture.homeSubmission = submission && submission.build ? submission.build() : submission;
            return builder;
        };
        builder.awaySubmission = (submissionOrBuilderFunc, id) => {
            const submission = submissionOrBuilderFunc instanceof Function
                ? submissionOrBuilderFunc(fixtureBuilder(fixture.date, id || fixture.id, true))
                : submissionOrBuilderFunc;
            fixture.awaySubmission = submission && submission.build ? submission.build() : submission;
            return builder;
        };
    }

    return builder;
}

export function matchBuilder() {
    const match = {
        homePlayers: null,
        awayPlayers: null,
        homeScore: null,
        awayScore: null,
    };

    const builder = {
        build: () => match,
    };
    builder.withHome = (playerOrName) => {
        match.homePlayers = match.homePlayers || [];
        if (playerOrName) {
            const player = playerOrName.id ? playerOrName : playerBuilder(playerOrName).build();
            match.homePlayers.push(player);
        }
        return builder;
    };
    builder.withAway = (playerOrName) => {
        match.awayPlayers = match.awayPlayers || [];
        if (playerOrName) {
            const player = playerOrName.id ? playerOrName : playerBuilder(playerOrName).build();
            match.awayPlayers.push(player);
        }
        return builder;
    };
    builder.scores = (home, away) => {
        match.homeScore = home;
        match.awayScore = away;
        return builder;
    };
    builder.sayg = (saygOrBuilderFunc, id) => {
        const sayg = saygOrBuilderFunc instanceof Function
            ? saygOrBuilderFunc(saygBuilder(id))
            : saygOrBuilderFunc;
        match.sayg = sayg.build ? sayg.build() : sayg;
        return builder;
    };

    return builder;
}

export function divisionFixtureBuilder(date, id) {
    const fixture = {
        id: id || createTemporaryId(),
        date: date,
        fixturesUsingAddress: [],
    };

    const builder = {
        build: () => fixture,
        addTo: (map) => {
            map[fixture.id] = fixture;
            return builder;
        },
    };

    const teamFactory = (t, id) => {
        if (t === null || t === undefined) {
            return null;
        }

        if (t && t.id) {
            return t;
        }

        if (t.build) {
            return t.build();
        }

        return {
            id: id || createTemporaryId(),
            name: t,
            address: '',
        };
    }

    builder.withOtherFixtureUsingUsingAddress = (name, id, awayName) => {
        const otherFixture = {
            id: id || createTemporaryId(),
            divisionId: createTemporaryId(),
            home: {
                id: createTemporaryId(),
                name: name
            },
            away: {
                id: createTemporaryId(),
                name: awayName || 'AWAY',
            },
        };

        fixture.fixturesUsingAddress.push(otherFixture);
        return builder;
    };
    builder.playing = (home, away) => {
        fixture.homeTeam = teamFactory(home);
        fixture.awayTeam = teamFactory(away);
        return builder;
    };
    builder.scores = (home, away) => {
        fixture.homeScore = home;
        fixture.awayScore = away;
        return builder;
    };
    builder.bye = (venue, id) => {
        fixture.homeTeam = teamFactory(venue, id);
        fixture.awayTeam = null;
        return builder;
    };
    builder.knockout = () => {
        fixture.isKnockout = true;
        return builder;
    };
    builder.postponed = () => {
        fixture.postponed = true;
        return builder;
    };
    builder.originalAwayTeamId = (id) => {
        fixture.originalAwayTeamId = id;
        return builder;
    };
    builder.accoladesCount = () => {
        fixture.accoladesCount = true;
        return builder;
    };
    builder.proposal = () => {
        fixture.proposal = true;
        return builder;
    };

    return builder;
}

export function fixtureDateBuilder(date) {
    const fixtureDate = {
        date: date,
        fixtures: [],
        tournamentFixtures: [],
        notes: [],
    };

    const builder = {
        build: () => fixtureDate,
    };
    builder.knockout = () => {
        fixtureDate.isKnockout = true;
        return builder;
    };
    builder.withFixture = (fixtureOrModifierFunc, id) => {
        const fixture = fixtureOrModifierFunc instanceof Function
            ? fixtureOrModifierFunc(divisionFixtureBuilder(date, id))
            : fixtureOrModifierFunc;
        fixtureDate.fixtures.push(fixture.build ? fixture.build() : fixture);
        return builder;
    };
    builder.withTournament = (tournamentOrModifierFunc, id) => {
        const tournament = tournamentOrModifierFunc instanceof Function
            ? tournamentOrModifierFunc(tournamentBuilder(id).date(date))
            : tournamentOrModifierFunc;
        fixtureDate.tournamentFixtures.push(tournament.build ? tournament.build() : tournament);
        return builder;
    };
    builder.withNote = (noteOrModifierFunc, id) => {
        const note = noteOrModifierFunc instanceof Function
            ? noteOrModifierFunc(noteBuilder(date, id))
            : noteOrModifierFunc;
        fixtureDate.notes.push(note.build ? note.build() : note);
        return builder;
    };
    builder.isNew = () => {
        fixtureDate.isNew = true;
        return builder;
    };

    return builder;
}

export function tournamentBuilder(id) {
    const tournament = {
        id: id || createTemporaryId(),
        sides: [],
        oneEighties: [],
        over100Checkouts: [],
        players: [],
    };

    const builder = {
        build: () => tournament,
        addTo: (map) => {
            map[tournament.id] = tournament;
            return builder;
        },
    };
    builder.type = (type) => {
        tournament.type = type;
        return builder;
    };
    builder.address = (address) => {
        tournament.address = address;
        return builder;
    };
    builder.winner = (name, id, teamId) => {
        tournament.winningSide = {
            id: id || createTemporaryId(),
            name: name,
            teamId,
        };
        return builder;
    };
    builder.withSide = (sideOrBuilderFunc) => {
        const side = sideOrBuilderFunc instanceof Function
            ? sideOrBuilderFunc(sideBuilder())
            : sideOrBuilderFunc;
        tournament.sides.push(side.build ? side.build() : side);
        return builder;
    };
    builder.withPlayer = (playerOrId) => {
        tournament.players.push(playerOrId.id ? playerOrId.id : playerOrId);
        return builder;
    };
    builder.date = (date) => {
        tournament.date = date;
        return builder;
    };
    builder.notes = (notes) => {
        tournament.notes = notes;
        return builder;
    };
    builder.forSeason = (seasonOrId) => {
        if (seasonOrId.id) {
            tournament.seasonId = seasonOrId.id;
        } else {
            tournament.seasonId = seasonOrId;
        }
        return builder;
    };
    builder.forDivision = (divisionOrId) => {
        if (divisionOrId.id) {
            tournament.divisionId = divisionOrId.id;
        } else {
            tournament.divisionId = divisionOrId;
        }
        return builder;
    };
    builder.proposed = () => {
        tournament.proposed = true;
        return builder;
    };
    builder.accoladesCount = () => {
        tournament.accoladesCount = true;
        return builder;
    };
    builder.updated = (date) => {
        tournament.updated = date;
        return builder;
    };
    builder.round = (roundOrBuilderFunc) => {
        const round = roundOrBuilderFunc instanceof Function
            ? roundOrBuilderFunc(roundBuilder())
            : roundOrBuilderFunc;
        tournament.round = round.build ? round.build() : round;
        return builder;
    };
    builder.host = (host) => {
        tournament.host = host;
        return builder;
    };
    builder.opponent = (opponent) => {
        tournament.opponent = opponent;
        return builder;
    };
    builder.gender = (gender) => {
        tournament.gender = gender;
        return builder;
    };
    builder.singleRound = () => {
        tournament.singleRound = true;
        return builder;
    };

    return builder;
}

export function sideBuilder(name, id) {
    const side = {
        id: id || createTemporaryId(),
        name: name,
        players: [],
    };

    const builder = {
        build: () => side,
    };
    builder.id = (id) => {
        side.id = id;
        return builder;
    };
    builder.name = (name) => {
        side.name = name;
        return builder;
    };
    builder.teamId = (id) => {
        side.teamId = id;
        return builder;
    };
    builder.noShow = () => {
        side.noShow = true;
        return builder;
    };
    builder.withPlayer = (nameOrPlayer, id, divisionId) => {
        const player = nameOrPlayer && nameOrPlayer.id ? nameOrPlayer : {
            id: id || createTemporaryId(),
            name: nameOrPlayer,
            divisionId,
        };
        side.players.push(player);
        return builder;
    };

    return builder;
}

export function roundBuilder() {
    const round = {
        matches: [],
        matchOptions: [],
        nextRound: null,
    };

    const builder = {
        build: () => round,
    };
    builder.withMatch = (matchOrBuilderFunc, id) => {
        const match = matchOrBuilderFunc instanceof Function
            ? matchOrBuilderFunc(tournamentMatchBuilder(id))
            : matchOrBuilderFunc;
        round.matches.push(match.build ? match.build() : match);
        return builder;
    };
    builder.round = (roundOrBuilderFunc) => {
        const nextRound = roundOrBuilderFunc instanceof Function
            ? roundOrBuilderFunc(roundBuilder())
            : roundOrBuilderFunc;
        round.nextRound = nextRound.build ? nextRound.build() : nextRound;
        return builder;
    };
    builder.withMatchOption = (matchOptionOrBuilderFunc) => {
        const matchOption = matchOptionOrBuilderFunc instanceof Function
            ? matchOptionOrBuilderFunc(matchOptionsBuilder())
            : matchOptionOrBuilderFunc;
        round.matchOptions.push(matchOption.build ? matchOption.build() : matchOption);
        return builder;
    };

    return builder;
}

export function matchOptionsBuilder() {
    const options = {
        startingScore: null,
        numberOfLegs: null,
    };

    const builder = {
        build: () => options,
    };
    builder.numberOfLegs = (legs) => {
        options.numberOfLegs = legs;
        return builder;
    };
    builder.startingScore = (score) => {
        options.startingScore = score;
        return builder;
    };
    builder.playerCount = (count) => {
        options.playerCount = count;
        return builder;
    };

    return builder;
}

export function tournamentMatchBuilder(id) {
    const match = {
        id: id || createTemporaryId(),
        sideA: null,
        sideB: null,
        scoreA: null,
        scoreB: null,
    };

    const builder = {
        build: () => match,
    };
    builder.sideA = (side, score) => {
        match.sideA = side.name
            ? side
            : { id: createTemporaryId(), name: side };
        if (score !== undefined) {
            match.scoreA = score;
        }
        return builder;
    };
    builder.sideB = (side, score) => {
        match.sideB = side.name
            ? side
            : { id: createTemporaryId(), name: side };
        if (score !== undefined) {
            match.scoreB = score;
        }
        return builder;
    };
    builder.saygId = (id) => {
        match.saygId = id;
        return builder;
    };
    builder.noId = () => {
        match.id = null;
        return builder;
    };

    return builder;
}

export function noteBuilder(date, id) {
    const note = {
        id: id || createTemporaryId(),
        date: date,
    };

    const builder = {
        build: () => note,
    };
    builder.note = (text) => {
        note.note = text;
        return builder;
    };
    builder.season = (seasonOrId) => {
        note.seasonId = seasonOrId.id ? seasonOrId.id : seasonOrId;
        return builder;
    };
    builder.division = (divisionOrId) => {
        note.divisionId = divisionOrId.id ? divisionOrId.id : divisionOrId;
        return builder;
    };
    builder.updated = (date) => {
        note.updated = date;
        return builder;
    };
    builder.noId = () => {
        note.id = null;
        return builder;
    };

    return builder;
}

export function seasonBuilder(name, id) {
    const season = {
        id: id || createTemporaryId(),
        name,
        divisions: [],
    };

    const builder = {
        build: () => season,
        addTo: (map) => {
            map[season.id] = season;
            return builder;
        },
    };
    builder.withDivision = (divisionOrId) => {
        season.divisions.push(divisionOrId.id ? divisionOrId : {
            id: divisionOrId,
            name: undefined
        });
        return builder;
    };
    builder.starting = (date) => {
        season.startDate = date;
        return builder;
    };
    builder.ending = (date) => {
        season.endDate = date;
        return builder;
    };
    builder.withDivisionId = (divisionOrId) => {
        // this is for the editSeason dialog only
        season.divisionIds = season.divisionIds || [];
        season.divisionIds.push(divisionOrId.id ? divisionOrId.id : divisionOrId);
        return builder;
    };
    builder.isCurrent = () => {
        season.isCurrent = true;
        return builder;
    };

    return builder;
}

export function divisionBuilder(name, id) {
    const division = {
        id: id || createTemporaryId(),
        name,
    };

    // noinspection UnnecessaryLocalVariableJS
    const builder = {
        build: () => division,
        addTo: (map) => {
            map[division.id] = division;
            return builder;
        },
    };

    return builder;
}

export function saygBuilder(id) {
    const sayg = {
        id: id || createTemporaryId(),
        legs: {},
    };

    const builder = {
        build: () => sayg,
        addTo: (map) => {
            map[sayg.id] = sayg;
            return builder;
        },
    };
    builder.scores = (home, away) => {
        sayg.homeScore = home;
        sayg.awayScore = away;
        return builder;
    };
    builder.withLeg = (id, legOrBuilderFunc) => {
        const leg = legOrBuilderFunc instanceof Function
            ? legOrBuilderFunc(legBuilder())
            : legOrBuilderFunc;
        sayg.legs[id] = leg.build ? leg.build() : leg;
        return builder;
    };
    builder.yourName = (name) => {
        sayg.yourName = name;
        return builder;
    };
    builder.opponentName = (name) => {
        sayg.opponentName = name;
        return builder;
    };
    builder.updated = (updated) => {
        sayg.updated = updated;
        return builder;
    };
    builder.numberOfLegs = (legs) => {
        sayg.numberOfLegs = legs;
        return builder;
    };
    builder.startingScore = (score) => {
        sayg.startingScore = score;
        return builder;
    };

    return builder;
}

export function legBuilder() {
    const leg = {
        home: null,
        away: null,
        isLastLeg: false,
    };

    const builder = {
        build: () => leg,
    };
    builder.startingScore = (score) => {
        leg.startingScore = score;
        return builder;
    };
    builder.currentThrow = (homeOrAway) => {
        leg.currentThrow = homeOrAway;
        return builder;
    };
    builder.playerSequence = (homeOrAway, awayOrHome) => {
        leg.playerSequence = [
            { value: homeOrAway, text: homeOrAway.toUpperCase() },
            { value: awayOrHome, text: awayOrHome.toUpperCase() },
        ];
        return builder;
    };
    builder.lastLeg = () => {
        leg.isLastLeg = true;
        return builder;
    };
    builder.numberOfLegs = (legs) => {
        leg.numberOfLegs = legs;
        return builder;
    };
    builder.home = (competitorOrBuilderFunc) => {
        const competitor = competitorOrBuilderFunc instanceof Function
            ? competitorOrBuilderFunc(saygCompetitorBuilder())
            : competitorOrBuilderFunc;
        leg.home = competitor.build ? competitor.build() : competitor;
        return builder;
    };
    builder.away = (competitorOrBuilderFunc) => {
        const competitor = competitorOrBuilderFunc instanceof Function
            ? competitorOrBuilderFunc(saygCompetitorBuilder())
            : competitorOrBuilderFunc;
        leg.away = competitor.build ? competitor.build() : competitor;
        return builder;
    };
    builder.scores = (home, away) => {
        leg.homeScore = home;
        leg.awayScore = away;
        return builder;
    };
    builder.winner = (designation) => {
        leg.winner = designation;
        return builder;
    };

    return builder;
}

export function saygCompetitorBuilder() {
    const competitor = {
        throws: [],
        score: 0,
        bust: false,
        noOfDarts: 0,
    };

    const builder = {
        build: () => competitor,
    };
    builder.withThrow = (score, bust, noOfDarts) => {
        competitor.throws.push({
            score: score,
            bust: bust || false,
            noOfDarts,
        });
        return builder;
    };
    builder.score = (score) => {
        competitor.score = score;
        return builder;
    };
    builder.noOfDarts = (noOfDarts) => {
        competitor.noOfDarts = noOfDarts;
        return builder;
    };
    builder.startingScore = (startingScore) => {
        competitor.startingScore = startingScore;
        return builder;
    };
    builder.bust = () => {
        competitor.bust = true;
        return builder;
    };

    return builder;
}

export function playerBuilder(name, id) {
    const player = {
        id: id || createTemporaryId(),
        name,
    };

    const builder = {
        build: () => player,
        addTo: (map) => {
            map[player.id] = player;
            return builder;
        },
    };
    builder.captain = () => {
        player.captain = true;
        return builder;
    };
    builder.notes = (notes) => {
        player.notes = notes;
        return builder;
    };
    builder.noId = () => {
        delete player.id;
        return builder;
    };
    builder.email = (email) => {
        player.emailAddress = email;
        return builder;
    };
    builder.team = (team) => {
        player.teamId = team.id ? team.id : team;
        return builder;
    };
    builder.singles = (metricsFunc) => {
        player.singles = metricsFunc(metricsBuilder());
        return builder;
    };

    return builder;
}

export function metricsBuilder() {
    const metrics = {
    };

    const builder = {
        build: () => metrics,
    };
    builder.matchesPlayed = (count) => {
        metrics.matchesPlayed = count;
        return builder;
    };

    return builder;
}

export function divisionDataBuilder(divisionOrId) {
    const divisionId = divisionOrId && divisionOrId.id
        ? divisionOrId.id
        : divisionOrId || createTemporaryId();
    const divisionData = {
        id: divisionId || createTemporaryId(),
        name: divisionOrId && divisionOrId.name ? divisionOrId.name : null,
        fixtures: [],
        teams: [],
        season: null,
        dataErrors: [],
        players: [],
    };

    const builder = {
        build: () => divisionData,
        addTo: (map) => {
            map[divisionData.id] = divisionData;
            return builder;
        },
    };
    builder.withFixtureDate = (fixtureDateOrBuilderFunc, date) => {
        const fixtureDate = fixtureDateOrBuilderFunc instanceof Function
            ? fixtureDateOrBuilderFunc(fixtureDateBuilder(date))
            : fixtureDateOrBuilderFunc;
        divisionData.fixtures.push(fixtureDate.build ? fixtureDate.build() : fixtureDate);
        return builder;
    };
    builder.season = (seasonOrBuilderFunc, name, id) => {
        const season = seasonOrBuilderFunc instanceof Function
            ? seasonOrBuilderFunc(seasonBuilder(name, id))
            : seasonOrBuilderFunc;
        divisionData.season = season.build ? season.build() : season;
        return builder;
    };
    builder.name = (name) => {
        divisionData.name = name;
        return builder;
    };
    builder.withTeam = (teamOrBuilderFunc, name, id) => {
        const team = teamOrBuilderFunc instanceof Function
            ? teamOrBuilderFunc(teamBuilder(name, id))
            : teamOrBuilderFunc;
        divisionData.teams.push(team.build ? team.build() : team);
        return builder;
    };
    builder.withPlayer = (playerOrBuilderFunc, name, id) => {
        const player = playerOrBuilderFunc instanceof Function
            ? playerOrBuilderFunc(playerBuilder(name, id))
            : playerOrBuilderFunc;
        divisionData.players.push(player.build ? player.build() : player);
        return builder;
    };

    return builder;
}