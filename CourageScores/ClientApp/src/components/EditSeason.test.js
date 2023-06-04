// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick, doChange} from "../tests/helpers";
import React from "react";
import {EditSeason} from "./EditSeason";
import {createTemporaryId} from "../Utilities";

const mockedUsedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('EditSeason', () => {
    let context;
    let reportedError;
    let closed;
    let saved;
    let saveError;
    let updatedSeason;
    let alert;
    let confirm;
    let confirmResponse;
    let apiResponse;
    let deletedId;
    const seasonApi = {
        update: (data, lastUpdated) => {
            updatedSeason = { data, lastUpdated };
            return apiResponse;
        },
        delete: (id) => {
            deletedId = id;
            return apiResponse;
        }
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props, seasons, divisions) {
        window.alert = (message) => { alert = message };
        window.confirm = (message) => { confirm = message; return confirmResponse };
        alert = null;
        confirm = null;
        reportedError = null;
        closed = false;
        saved = false;
        confirmResponse = false;
        saveError = null;
        updatedSeason = null;
        deletedId = null;
        apiResponse = {
            success: true,
        };
        context = await renderApp(
            { seasonApi },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                seasons,
                divisions
            },
            (<EditSeason
                {...props}
                onClose={() => closed = true }
                onSave={() => saved = true }
                setSaveError={(err) => saveError = err }
            />));
    }

    const division1 = {
        id: createTemporaryId(),
        name: 'DIVISION 1',
    };
    const division2 = {
        id: createTemporaryId(),
        name: 'DIVISION 2',
    };
    const divisions = [ division1, division2 ];

    it('updates season name', async () => {
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
            startDate: '2023-01-01T00:00:00',
            endDate: '2023-05-01T00:00:00',
            divisionIds: [ division1.id ],
        }
        let updatedData;
        await renderComponent({
            data: season,
            onUpdateData: (update) => {
                updatedData = update;
            }
        }, [ season ], divisions);
        expect(reportedError).toBeNull();

        doChange(context.container, 'input[name="name"]', 'NEW SEASON NAME');

        expect(reportedError).toBeNull();
        expect(updatedData.id).toEqual(season.id);
        expect(updatedData.name).toEqual('NEW SEASON NAME');
    });

    it('updates season dates', async () => {
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
            startDate: '2023-01-01T00:00:00',
            endDate: '2023-05-01T00:00:00',
            divisionIds: [ division1.id ],
        }
        let updatedData;
        await renderComponent({
            data: season,
            onUpdateData: (update) => {
                updatedData = update;
            }
        }, [ season ], divisions);
        expect(reportedError).toBeNull();

        doChange(context.container, 'input[name="startDate"]', '2023-06-01');
        expect(reportedError).toBeNull();
        expect(updatedData.id).toEqual(season.id);
        expect(updatedData.startDate).toEqual('2023-06-01');

        doChange(context.container, 'input[name="endDate"]', '2023-09-01');
        expect(reportedError).toBeNull();
        expect(updatedData.id).toEqual(season.id);
        expect(updatedData.endDate).toEqual('2023-09-01');
    });

    it('can select a division', async () => {
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
            startDate: '2023-01-01T00:00:00',
            endDate: '2023-05-01T00:00:00',
            divisionIds: [ division1.id ],
        }
        let updatedData;
        await renderComponent({
            data: season,
            onUpdateData: (update) => {
                updatedData = update;
            }
        }, [ season ], divisions);
        expect(reportedError).toBeNull();

        const divisionOptions = Array.from(context.container.querySelectorAll('.list-group-item'));
        const unselectedDivision = divisionOptions.filter(d => d.className.indexOf('active') === -1)[0];
        expect(unselectedDivision.textContent).toEqual(division2.name);
        await doClick(unselectedDivision);

        expect(reportedError).toBeNull();
        expect(updatedData.id).toEqual(season.id);
        expect(updatedData.divisionIds).toEqual([ division1.id, division2.id ]);
    });

    it('can unselect a division', async () => {
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
            startDate: '2023-01-01T00:00:00',
            endDate: '2023-05-01T00:00:00',
            divisionIds: [ division1.id ],
        }
        let updatedData;
        await renderComponent({
            data: season,
            onUpdateData: (update) => {
                updatedData = update;
            }
        }, [ season ], divisions);
        expect(reportedError).toBeNull();

        const divisionOptions = Array.from(context.container.querySelectorAll('.list-group-item'));
        const selectedDivision = divisionOptions.filter(d => d.className.indexOf('active') !== -1)[0];
        expect(selectedDivision.textContent).toEqual(division1.name);
        await doClick(selectedDivision);

        expect(reportedError).toBeNull();
        expect(updatedData.id).toEqual(season.id);
        expect(updatedData.divisionIds).toEqual([ ]);
    });

    it('updates copy teams from when no id', async () => {
        const season = {
            name: 'SEASON',
            startDate: '2023-01-01T00:00:00',
            endDate: '2023-05-01T00:00:00',
            divisionIds: [ division1.id ],
        }
        const otherSeason = {
            id: createTemporaryId(),
            name: 'OTHER SEASON',
        };
        let updatedData;
        await renderComponent({
            data: season,
            onUpdateData: (update) => {
                updatedData = update;
            }
        }, [ otherSeason ], divisions);
        expect(reportedError).toBeNull();

        const otherSeasonMenuItem = context.container.querySelector('div.dropdown-menu button.dropdown-item');
        expect(otherSeasonMenuItem).toBeTruthy();
        expect(otherSeasonMenuItem.textContent).toEqual('OTHER SEASON');
        await doClick(otherSeasonMenuItem);

        expect(reportedError).toBeNull();
        expect(updatedData.copyTeamsFromSeasonId).toEqual(otherSeason.id);
    });

    it('prevents save when season name is empty', async () => {
        const season = {
            id: createTemporaryId(),
            name: '',
            startDate: '2023-01-01T00:00:00',
            endDate: '2023-05-01T00:00:00',
            divisionIds: [ division1.id ],
        }
        await renderComponent({
            data: season,
        }, [ season ], divisions);

        await doClick(context.container, 'button.btn-success');

        expect(alert).toEqual('Enter a season name');
        expect(saved).toEqual(false);
    });

    it('saves season updates', async () => {
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
            startDate: '2023-01-01T00:00:00',
            endDate: '2023-05-01T00:00:00',
            divisionIds: [ division1.id ],
        }
        await renderComponent({
            data: season,
        }, [ season ], divisions);
        expect(reportedError).toBeNull();

        await doClick(context.container, 'button.btn-success');

        expect(reportedError).toBeNull();
        expect(alert).toBeNull();
        expect(saved).toEqual(true);
        expect(updatedSeason).not.toBeNull();
    });

    it('reports saveError if an error during save', async () => {
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
            startDate: '2023-01-01T00:00:00',
            endDate: '2023-05-01T00:00:00',
            divisionIds: [ division1.id ],
        }
        await renderComponent({
            data: season,
        }, [ season ], divisions);
        expect(reportedError).toBeNull();
        apiResponse = {
            success: false
        }

        await doClick(context.container, 'button.btn-success');

        expect(reportedError).toBeNull();
        expect(saveError).toEqual(apiResponse);
    });

    it('confirms if season should be deleted', async () => {
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
            startDate: '2023-01-01T00:00:00',
            endDate: '2023-05-01T00:00:00',
            divisionIds: [ division1.id ],
        }
        await renderComponent({
            data: season,
        }, [ season ], divisions);
        expect(reportedError).toBeNull();

        await doClick(context.container, 'button.btn-danger');

        expect(confirm).toEqual('Are you sure you want to delete the SEASON season?');
        expect(saved).toEqual(false);
    });

    it('deletes season', async () => {
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
            startDate: '2023-01-01T00:00:00',
            endDate: '2023-05-01T00:00:00',
            divisionIds: [ division1.id ],
        }
        await renderComponent({
            data: season,
        }, [ season ], divisions);
        expect(reportedError).toBeNull();
        confirmResponse = true;

        await doClick(context.container, 'button.btn-danger');

        expect(reportedError).toBeNull();
        expect(deletedId).toEqual(season.id);
    });

    it('reports saveError if season cannot be deleted', async () => {
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
            startDate: '2023-01-01T00:00:00',
            endDate: '2023-05-01T00:00:00',
            divisionIds: [ division1.id ],
        }
        await renderComponent({
            data: season,
        }, [ season ], divisions);
        expect(reportedError).toBeNull();
        confirmResponse = true;
        apiResponse = {
            success: false
        };

        await doClick(context.container, 'button.btn-danger');

        expect(reportedError).toBeNull();
        expect(deletedId).toEqual(season.id);
        expect(saveError).toEqual(apiResponse);
    });

    it('navigates to home when season deleted', async () => {
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
            startDate: '2023-01-01T00:00:00',
            endDate: '2023-05-01T00:00:00',
            divisionIds: [ division1.id ],
        }
        await renderComponent({
            data: season,
        }, [ season ], divisions);
        expect(reportedError).toBeNull();
        confirmResponse = true;

        await doClick(context.container, 'button.btn-danger');

        expect(mockedUsedNavigate).toHaveBeenCalledWith('https://localhost');
    });
});