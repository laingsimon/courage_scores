// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../../helpers/tests";
import React from "react";
import {MasterDraw} from "./MasterDraw";
import {renderDate} from "../../../../helpers/rendering";

describe('MasterDraw', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
        reportedError = null;
        context = await renderApp(
            {},
            null,
            {
                onError: (err) => {
                    if (err.message) {
                        reportedError = {
                            message: err.message,
                            stack: err.stack
                        };
                    } else {
                        reportedError = err;
                    }
                },
            },
            (<MasterDraw {...props} />));
    }

    describe('renders', () => {
        it('matches', async () => {
            const match1 = {
                sideA: {name: 'A'},
                sideB: {name: 'B'},
            };
            const match2 = {
                sideA: {name: 'C'},
                sideB: {name: 'D'},
            };
            const matches = [match1, match2];

            await renderComponent({
                matches: matches,
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                notes: 'NOTES',
            });

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('table.table');
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(2);
            expect(Array.from(rows[0].querySelectorAll('td')).map(td => td.textContent)).toEqual(['1', 'A', 'v', 'B']);
            expect(Array.from(rows[1].querySelectorAll('td')).map(td => td.textContent)).toEqual(['2', 'C', 'v', 'D']);
        });

        it('tournament properties', async () => {
            await renderComponent({
                matches: [],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                notes: 'NOTES',
            });

            expect(reportedError).toBeNull();
            const tournamentProperties = context.container.querySelector('div.d-flex > div:nth-child(2)');
            expect(tournamentProperties.textContent).toContain('Gender: GENDER');
            expect(tournamentProperties.textContent).toContain('Date: ' + renderDate('2023-05-06'));
            expect(tournamentProperties.textContent).toContain('Notes: NOTES');
        });

        it('when no notes', async () => {
            await renderComponent({
                matches: [],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                notes: '',
            });

            expect(reportedError).toBeNull();
            const tournamentProperties = context.container.querySelector('div.d-flex > div:nth-child(2)');
            expect(tournamentProperties.textContent).toContain('Gender: GENDER');
            expect(tournamentProperties.textContent).not.toContain('Notes:');
        });
    });
});