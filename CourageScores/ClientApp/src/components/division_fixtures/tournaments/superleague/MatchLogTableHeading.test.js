// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../../helpers/tests";
import React from "react";
import {MatchLogTableHeading} from "./MatchLogTableHeading";

describe('MatchLogTableHeading', () => {
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
            (<MatchLogTableHeading {...props} />),
            null,
            null,
            'tbody');
    }

    function getRowContent(row) {
        return Array.from(row.querySelectorAll('th')).map(th => th.textContent);
    }

    describe('renders', () => {
        it('rows', async () => {
            await renderComponent({
                team: 'TEAM',
                noOfThrows: 3,
            });

            expect(reportedError).toBeNull();
            const rows = Array.from(context.container.querySelectorAll('tr'));
            expect(rows.length).toEqual(2);
            expect(getRowContent(rows[0])).toEqual(['TEAM', 'Dart average', '', '']);
            expect(getRowContent(rows[1])).toEqual(['Player', 'L', 'AD', 'GS', 'SL', '100+', '140+', '180', 'T', 'Player', 'Team', 'GD', '1', '2', '3', '4']);
        });

        it('correct dart average offset', async () => {
            await renderComponent({
                team: 'TEAM',
                noOfThrows: 3,
            });

            expect(reportedError).toBeNull();
            const rows = Array.from(context.container.querySelectorAll('tr'));
            expect(rows.length).toEqual(2);
            const cells = Array.from(rows[0].querySelectorAll('th'));
            expect(cells.length).toEqual(4);
            expect(cells[0].colSpan).toEqual(9);
            expect(cells[1].colSpan).toEqual(2);
            expect(cells[2].colSpan).toEqual(1);
            expect(cells[3].colSpan).toEqual(4);
        });
    });
});