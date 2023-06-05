// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick, doChange} from "../tests/helpers";
import React from "react";
import {EditDivision} from "./EditDivision";
import {createTemporaryId} from "../helpers/projection";

const mockedUsedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('EditDivision', () => {
    let context;
    let reportedError;
    let closed;
    let saved;
    let saveError;
    let updatedDivision;
    let alert;
    let confirm;
    let confirmResponse;
    let apiResponse;
    let deletedId;
    const divisionApi = {
        update: (data, lastUpdated) => {
            updatedDivision = { data, lastUpdated };
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

    async function renderComponent(props) {
        window.alert = (message) => { alert = message };
        window.confirm = (message) => { confirm = message; return confirmResponse };
        alert = null;
        confirm = null;
        reportedError = null;
        closed = false;
        saved = false;
        confirmResponse = false;
        saveError = null;
        updatedDivision = null;
        deletedId = null;
        apiResponse = {
            success: true,
        };
        context = await renderApp(
            { divisionApi },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                }
            },
            (<EditDivision
                {...props}
                onClose={() => closed = true }
                onSave={() => saved = true }
                setSaveError={(err) => saveError = err }
            />));
    }

    it('updates division name', async () => {
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        }
        let updatedData;
        await renderComponent({
            data: division,
            onUpdateData: (update) => {
                updatedData = update;
            }
        });
        expect(reportedError).toBeNull();

        doChange(context.container, 'input[name="name"]', 'NEW DIVISION NAME');

        expect(reportedError).toBeNull();
        expect(updatedData.id).toEqual(division.id);
        expect(updatedData.name).toEqual('NEW DIVISION NAME');
    });

    it('prevents save when division name is empty', async () => {
        const division = {
            id: createTemporaryId(),
            name: '',
        }
        await renderComponent({
            data: division,
        });

        await doClick(context.container, 'button.btn-success');

        expect(alert).toEqual('Enter a division name');
        expect(saved).toEqual(false);
    });

    it('saves division updates', async () => {
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        }
        await renderComponent({
            data: division,
        });
        expect(reportedError).toBeNull();

        await doClick(context.container, 'button.btn-success');

        expect(reportedError).toBeNull();
        expect(alert).toBeNull();
        expect(saved).toEqual(true);
        expect(updatedDivision).not.toBeNull();
    });

    it('reports saveError if an error during save', async () => {
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        }
        await renderComponent({
            data: division,
        });
        expect(reportedError).toBeNull();
        apiResponse = {
            success: false
        }

        await doClick(context.container, 'button.btn-success');

        expect(reportedError).toBeNull();
        expect(saveError).toEqual(apiResponse);
    });

    it('confirms if division should be deleted', async () => {
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        }
        await renderComponent({
            data: division,
        });
        expect(reportedError).toBeNull();

        await doClick(context.container, 'button.btn-danger');

        expect(confirm).toEqual('Are you sure you want to delete the DIVISION division?');
        expect(saved).toEqual(false);
    });

    it('deletes division', async () => {
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        }
        await renderComponent({
            data: division,
        });
        expect(reportedError).toBeNull();
        confirmResponse = true;

        await doClick(context.container, 'button.btn-danger');

        expect(reportedError).toBeNull();
        expect(deletedId).toEqual(division.id);
    });

    it('reports saveError if division cannot be deleted', async () => {
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        }
        await renderComponent({
            data: division,
        });
        expect(reportedError).toBeNull();
        confirmResponse = true;
        apiResponse = {
            success: false
        };

        await doClick(context.container, 'button.btn-danger');

        expect(reportedError).toBeNull();
        expect(deletedId).toEqual(division.id);
        expect(saveError).toEqual(apiResponse);
    });

    it('navigates to home when division deleted', async () => {
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        }
        await renderComponent({
            data: division,
        });
        expect(reportedError).toBeNull();
        confirmResponse = true;

        await doClick(context.container, 'button.btn-danger');

        expect(mockedUsedNavigate).toHaveBeenCalledWith('https://localhost');
    });
});