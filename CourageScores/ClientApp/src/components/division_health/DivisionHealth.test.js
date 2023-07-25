// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../helpers/tests";
import React from "react";
import {DivisionHealth} from "./DivisionHealth";
import {DivisionDataContainer} from "../DivisionDataContainer";
import {createTemporaryId} from "../../helpers/projection";

describe('DivisionHealth', () => {
    let context;
    let reportedError;
    let apiResponse;

    const seasonApi = {
        getHealth: async (id) => {
            return apiResponse(id);
        }
    }

    beforeEach(() => {
        apiResponse = (id) => { return { id: id, checks: { }, success: true, errors: [], warnings: [], messages: [] } };
    });

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(divisionDataProps) {
        reportedError = null;
        context = await renderApp(
            { seasonApi },
            { },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
            },
            (<DivisionDataContainer {...divisionDataProps}>
                <DivisionHealth />
            </DivisionDataContainer>));
    }

    it('handles error during load', async () => {
        const seasonId = createTemporaryId();
        apiResponse = () => {
            throw new Error('SOME ERROR');
        };
        await renderComponent({
            season: {
                id: seasonId
            }
        });

        expect(reportedError).not.toBeNull();
    });

    it('shows health-check results', async () => {
        const seasonId = createTemporaryId();
        await renderComponent({
            season: {
                id: seasonId
            }
        });

        expect(reportedError).toBeNull();
        expect(context.container.querySelector('div[datatype="view-health-check"]')).toBeTruthy();
    });
});