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
        apiResponse = (id) => {
            return {id: id, checks: {}, success: true, errors: [], warnings: [], messages: []}
        };
    });

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(divisionDataProps) {
        reportedError = null;
        context = await renderApp(
            {seasonApi},
            {},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
            },
            (<DivisionDataContainer {...divisionDataProps}>
                <DivisionHealth/>
            </DivisionDataContainer>));
    }

    function assertHeading(text, className) {
        const heading = context.container.querySelector('h3');
        expect(heading.textContent).toEqual(text);
        expect(heading.className).toContain(className);
    }

    it('handles error during load', async () => {
        apiResponse = () => {
            throw new Error('SOME ERROR');
        };
        await renderComponent({
            season: {
                id: createTemporaryId()
            }
        });

        expect(reportedError).not.toBeNull();
    });

    it('shows health-check results', async () => {
        await renderComponent({
            season: {
                id: createTemporaryId()
            }
        });

        expect(reportedError).toBeNull();
        expect(context.container.querySelector('div[datatype="view-health-check"]')).toBeTruthy();
    });

    it('when success and no errors or warnings should show healthy', async () => {
        apiResponse = () => {
            return {
                success: true,
                errors: [],
                warnings: [],
                messages: [],
                checks: {},
            };
        };

        await renderComponent({
            season: {
                id: createTemporaryId()
            }
        });

        expect(reportedError).toBeNull();
        assertHeading('Status: Healthy', 'text-success');
    });

    it('when success and some errors should show unhealthy', async () => {
        apiResponse = () => {
            return {
                success: true,
                errors: ['some error'],
                warnings: [],
                messages: [],
                checks: {},
            };
        };

        await renderComponent({
            season: {
                id: createTemporaryId()
            }
        });

        expect(reportedError).toBeNull();
        assertHeading('Status: Unhealthy', 'text-warning');
    });

    it('when success and some warnings should show unhealthy', async () => {
        apiResponse = () => {
            return {
                success: true,
                errors: [],
                warnings: ['warning'],
                messages: [],
                checks: {},
            };
        };

        await renderComponent({
            season: {
                id: createTemporaryId()
            }
        });

        expect(reportedError).toBeNull();
        assertHeading('Status: Unhealthy', 'text-warning');
    });

    it('when success and some messages should show healthy', async () => {
        apiResponse = () => {
            return {
                success: true,
                errors: [],
                warnings: [],
                messages: ['message'],
                checks: {},
            };
        };

        await renderComponent({
            season: {
                id: createTemporaryId()
            }
        });

        expect(reportedError).toBeNull();
        assertHeading('Status: Healthy', 'text-success');
    });

    it('when unsuccess and no errors, warnings or messages should show unhealthy', async () => {
        apiResponse = () => {
            return {
                success: false,
                errors: [],
                warnings: [],
                messages: [],
                checks: {},
            };
        };

        await renderComponent({
            season: {
                id: createTemporaryId()
            }
        });

        expect(reportedError).toBeNull();
        assertHeading('Status: Unhealthy', 'text-warning');
    });
});