// noinspection JSUnresolvedFunction

import {cleanUp, doSelectOption, renderApp} from "../../../helpers/tests";
import {toMap} from "../../../helpers/collections";
import React from "react";
import {AssignPlaceholders} from "./AssignPlaceholders";
import {divisionBuilder, seasonBuilder, teamBuilder} from "../../../helpers/builders";

describe('AssignPlaceholders', () => {
    let context;
    let reportedError;
    let placeholderMappings;

    function setPlaceholderMappings(value) {
        placeholderMappings = value;
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        placeholderMappings = null;
        reportedError = null;
    });

    async function renderComponent(appProps, props) {
        context = await renderApp(
            {},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                ...appProps,
            },
            (<AssignPlaceholders {...props} setPlaceholderMappings={setPlaceholderMappings} />));
    }

    describe('renders', () => {
        const division1 = divisionBuilder('DIVISION 1').build();
        const division2 = divisionBuilder('DIVISION 2').build();
        const season = seasonBuilder('SEASON')
            .withDivision(division2)
            .withDivision(division1)
            .build();
        const teamA = teamBuilder('TEAM A')
            .address('ADDRESS A')
            .forSeason(season, division1, [])
            .build();
        const teamAA = teamBuilder('TEAM AA')
            .address('ADDRESS A')
            .forSeason(season, division1, [])
            .build();
        const teamB = teamBuilder('TEAM B')
            .address('ADDRESS B')
            .forSeason(season, division2, [])
            .build();
        const teamC = teamBuilder('TEAM C')
            .address('ADDRESS C')
            .forSeason(season, division1, [])
            .build();
        const template = {
            sharedAddresses: [],
            divisions: [{
                sharedAddresses: [],
                dates: [{
                    fixtures: [
                        { home: 'C', away: 'B' },
                        { home: 'A' },
                    ]
                }],
            }, {
                sharedAddresses: [],
                dates: [{
                    fixtures: [
                        { home: 'D' },
                    ]
                }],
            }],
        };

        it('divisions in order', async () => {
            await renderComponent({
                    divisions: [division2, division1],
                    seasons: toMap([season]),
                    teams: toMap([teamA, teamB]),
                },
                {
                    seasonId: season.id,
                    selectedTemplate: { result: template },
                    placeholderMappings: {},
                });

            const divisions = Array.from(context.container.querySelectorAll('h6'));
            expect(divisions.map(d => d.textContent)).toEqual([ 'DIVISION 1', 'DIVISION 2' ]);
        });

        it('placeholders appropriate to each division in order', async () => {
            await renderComponent({
                    divisions: [division2, division1],
                    seasons: toMap([season]),
                    teams: toMap([teamA, teamB]),
                },
                {
                    seasonId: season.id,
                    selectedTemplate: { result: template },
                    placeholderMappings: {},
                });

            const div1 = context.container.querySelector('div > div > div:nth-child(1)');
            const div2 = context.container.querySelector('div > div > div:nth-child(2)');
            const div1Placeholders = Array.from(div1.querySelectorAll('ul > li > span'));
            const div2Placeholders = Array.from(div2.querySelectorAll('ul > li > span'));
            expect(div1Placeholders.map(li => li.textContent)).toEqual(['A', 'B', 'C']);
            expect(div2Placeholders.map(li => li.textContent)).toEqual(['D']);
        });

        it('template shared address placeholders', async () => {
            const templateWithSharedAddresses = {
                sharedAddresses: [ [ 'A', 'D' ] ],
                divisions: [{
                    sharedAddresses: [],
                    dates: [{
                        fixtures: [
                            { home: 'C', away: 'B' },
                            { home: 'A' },
                        ]
                    }],
                }, {
                    sharedAddresses: [],
                    dates: [{
                        fixtures: [
                            { home: 'D' },
                        ]
                    }],
                }],
            };
            await renderComponent({
                    divisions: [division2, division1],
                    seasons: toMap([season]),
                    teams: toMap([teamA, teamB]),
                },
                {
                    seasonId: season.id,
                    selectedTemplate: { result: templateWithSharedAddresses },
                    placeholderMappings: {},
                });

            const div1 = context.container.querySelector('div > div > div:nth-child(1)');
            const div1Placeholders = Array.from(div1.querySelectorAll('ul > li'));
            const placeholderA = div1Placeholders.filter(p => p.querySelector('span').textContent === 'A')[0];
            expect(placeholderA.textContent).toContain('Reserved for use by team with shared address across divisions');
            expect(placeholderA.querySelector('span').className).toContain('bg-warning');
        });

        it('division shared address placeholders', async () => {
            const templateWithSharedAddresses = {
                sharedAddresses: [],
                divisions: [{
                    sharedAddresses: [ [ 'B', 'C' ] ],
                    dates: [{
                        fixtures: [
                            { home: 'C', away: 'B' },
                            { home: 'A' },
                        ]
                    }],
                }, {
                    sharedAddresses: [],
                    dates: [{
                        fixtures: [
                            { home: 'D' },
                        ]
                    }],
                }],
            };
            await renderComponent({
                    divisions: [division2, division1],
                    seasons: toMap([season]),
                    teams: toMap([teamA, teamB]),
                },
                {
                    seasonId: season.id,
                    selectedTemplate: { result: templateWithSharedAddresses },
                    placeholderMappings: {},
                });

            const div1 = context.container.querySelector('div > div > div:nth-child(1)');
            const div1Placeholders = Array.from(div1.querySelectorAll('ul > li'));
            const placeholderB = div1Placeholders.filter(p => p.querySelector('span').textContent === 'B')[0];
            expect(placeholderB.textContent).toContain('Reserved for use by team with shared address in division');
            expect(placeholderB.querySelector('span').className).toContain('bg-secondary text-light');
        });

        it('teams appropriate to each division in order', async () => {
            await renderComponent({
                    divisions: [division2, division1],
                    seasons: toMap([season]),
                    teams: toMap([teamC, teamA, teamB]),
                },
                {
                    seasonId: season.id,
                    selectedTemplate: { result: template },
                    placeholderMappings: {},
                });

            const div1 = context.container.querySelector('div > div > div:nth-child(1)');
            const div1Placeholders = Array.from(div1.querySelectorAll('ul > li'));
            const placeholderA = div1Placeholders.filter(p => p.querySelector('span').textContent === 'A')[0];
            const dropdownItems = Array.from(placeholderA.querySelectorAll('.dropdown-menu .dropdown-item'));
            expect(dropdownItems.map(li => li.textContent)).toEqual(['🎲 Randomly assign', 'TEAM A', 'TEAM C']);
        });

        it('teams with shared addresses in dropdown', async () => {
            await renderComponent({
                    divisions: [division2, division1],
                    seasons: toMap([season]),
                    teams: toMap([teamA, teamAA]),
                },
                {
                    seasonId: season.id,
                    selectedTemplate: { result: template },
                    placeholderMappings: {},
                });

            const div1 = context.container.querySelector('div > div > div:nth-child(1)');
            const div1Placeholders = Array.from(div1.querySelectorAll('ul > li'));
            const placeholderA = div1Placeholders.filter(p => p.querySelector('span').textContent === 'A')[0];
            const dropdownItems = Array.from(placeholderA.querySelectorAll('.dropdown-menu .dropdown-item'));
            expect(dropdownItems.map(li => li.textContent)).toEqual(['🎲 Randomly assign', '🚫 TEAM A (has shared address)', '🚫 TEAM AA (has shared address)']);
        });
    });

    describe('interactivity', () => {
        const division1 = divisionBuilder('DIVISION 1').build();
        const division2 = divisionBuilder('DIVISION 2').build();
        const season = seasonBuilder('SEASON')
            .withDivision(division2)
            .withDivision(division1)
            .build();
        const teamA = teamBuilder('TEAM A')
            .address('ADDRESS A')
            .forSeason(season, division1, [])
            .build();
        const teamC = teamBuilder('TEAM C')
            .address('ADDRESS C')
            .forSeason(season, division1, [])
            .build();
        const template = {
            sharedAddresses: [],
            divisions: [{
                sharedAddresses: [],
                dates: [{
                    fixtures: [
                        { home: 'C', away: 'B' },
                        { home: 'A' },
                    ]
                }],
            }, {
                sharedAddresses: [],
                dates: [{
                    fixtures: [
                        { home: 'D' },
                    ]
                }],
            }],
        };

        it('can assign team for placeholder', async () => {
            await renderComponent({
                    divisions: [division2, division1],
                    seasons: toMap([season]),
                    teams: toMap([teamA, teamC]),
                },
                {
                    seasonId: season.id,
                    selectedTemplate: { result: template },
                    placeholderMappings: {},
                });

            const div1 = context.container.querySelector('div > div > div:nth-child(1)');
            const div1Placeholders = Array.from(div1.querySelectorAll('ul > li'));
            const placeholderA = div1Placeholders.filter(p => p.querySelector('span').textContent === 'A')[0];

            await doSelectOption(placeholderA.querySelector('.dropdown-menu'), 'TEAM A');

            expect(placeholderMappings).toEqual({
                'A': teamA.id
            });
        });

        it('can unassign team for placeholder', async () => {
            await renderComponent({
                    divisions: [division2, division1],
                    seasons: toMap([season]),
                    teams: toMap([teamA, teamC]),
                },
                {
                    seasonId: season.id,
                    selectedTemplate: { result: template },
                    placeholderMappings: {
                        'A': teamA.id
                    },
                });

            const div1 = context.container.querySelector('div > div > div:nth-child(1)');
            const div1Placeholders = Array.from(div1.querySelectorAll('ul > li'));
            const placeholderA = div1Placeholders.filter(p => p.querySelector('span').textContent === 'A')[0];

            await doSelectOption(placeholderA.querySelector('.dropdown-menu'), '🎲 Randomly assign');

            expect(placeholderMappings).toEqual({});
        });
    });
});