import {api, appProps, brandingProps, cleanUp, ErrorState, iocProps, renderApp, TestContext} from "../../helpers/tests";
import React from "react";
import {DivisionHealth} from "./DivisionHealth";
import {DivisionDataContainer, IDivisionDataContainerProps} from "../DivisionDataContainer";
import {createTemporaryId} from "../../helpers/projection";
import {ISeasonHealthCheckResultDto} from "../../interfaces/serverSide/Health/ISeasonHealthCheckResultDto";
import {ISeasonApi} from "../../api/season";

describe('DivisionHealth', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let apiResponse: (id: string) => ISeasonHealthCheckResultDto;

    const seasonApi = api<ISeasonApi>({
        getHealth: async (id: string): Promise<ISeasonHealthCheckResultDto> => {
            return apiResponse(id);
        }
    });

    async function setDivisionData() {

    }

    async function onReloadDivision() {
        return null;
    }

    beforeEach(() => {
        apiResponse = (_: string): ISeasonHealthCheckResultDto => {
            return {
                checks: {},
                success: true,
                errors: [],
                warnings: [],
                messages: []
            };
        };
        reportedError = new ErrorState();
    });

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(divisionDataProps: IDivisionDataContainerProps) {
        context = await renderApp(
            iocProps({seasonApi}),
            brandingProps(),
            appProps({}, reportedError),
            (<DivisionDataContainer {...divisionDataProps}>
                <DivisionHealth/>
            </DivisionDataContainer>));
    }

    function assertHeading(text: string, className: string) {
        const heading = context.container.querySelector('h3');
        expect(heading.textContent).toEqual(text);
        expect(heading.className).toContain(className);
    }

    it('handles error during load', async () => {
        apiResponse = () => {
            throw new Error('SOME ERROR');
        };
        await renderComponent({
            id: createTemporaryId(),
            name: '',
            season: {
                name: '',
                id: createTemporaryId()
            },
            setDivisionData,
            onReloadDivision,
        });

        expect(reportedError.hasError()).toEqual(true);
    });

    it('shows health-check results', async () => {
        await renderComponent({
            id: createTemporaryId(),
            name: '',
            season: {
                name: '',
                id: createTemporaryId()
            },
            setDivisionData,
            onReloadDivision,
        });

        expect(reportedError.hasError()).toEqual(false);
        expect(context.container.querySelector('div[datatype="view-health-check"]')).toBeTruthy();
    });

    it('when success and no errors or warnings should show healthy', async () => {
        apiResponse = (): ISeasonHealthCheckResultDto => {
            return {
                success: true,
                errors: [],
                warnings: [],
                messages: [],
                checks: {},
            };
        };

        await renderComponent({
            id: createTemporaryId(),
            name: '',
            season: {
                name: '',
                id: createTemporaryId()
            },
            setDivisionData,
            onReloadDivision,
        });

        expect(reportedError.hasError()).toEqual(false);
        assertHeading('Status: Healthy', 'text-success');
    });

    it('when success and some errors should show unhealthy', async () => {
        apiResponse = (): ISeasonHealthCheckResultDto => {
            return {
                success: true,
                errors: ['some error'],
                warnings: [],
                messages: [],
                checks: {},
            };
        };

        await renderComponent({
            id: createTemporaryId(),
            name: '',
            season: {
                name: '',
                id: createTemporaryId()
            },
            setDivisionData,
            onReloadDivision,
        });

        expect(reportedError.hasError()).toEqual(false);
        assertHeading('Status: Unhealthy', 'text-warning');
    });

    it('when success and some warnings should show unhealthy', async () => {
        apiResponse = (): ISeasonHealthCheckResultDto => {
            return {
                success: true,
                errors: [],
                warnings: ['warning'],
                messages: [],
                checks: {},
            };
        };

        await renderComponent({
            id: createTemporaryId(),
            name: '',
            season: {
                name: '',
                id: createTemporaryId()
            },
            setDivisionData,
            onReloadDivision,
        });

        expect(reportedError.hasError()).toEqual(false);
        assertHeading('Status: Unhealthy', 'text-warning');
    });

    it('when success and some messages should show healthy', async () => {
        apiResponse = (): ISeasonHealthCheckResultDto => {
            return {
                success: true,
                errors: [],
                warnings: [],
                messages: ['message'],
                checks: {},
            };
        };

        await renderComponent({
            id: createTemporaryId(),
            name: '',
            season: {
                name: '',
                id: createTemporaryId()
            },
            setDivisionData,
            onReloadDivision,
        });

        expect(reportedError.hasError()).toEqual(false);
        assertHeading('Status: Healthy', 'text-success');
    });

    it('when unsuccess and no errors, warnings or messages should show unhealthy', async () => {
        apiResponse = (): ISeasonHealthCheckResultDto => {
            return {
                success: false,
                errors: [],
                warnings: [],
                messages: [],
                checks: {},
            };
        };

        await renderComponent({
            id: createTemporaryId(),
            name: '',
            season: {
                name: '',
                id: createTemporaryId()
            },
            setDivisionData,
            onReloadDivision,
        });

        expect(reportedError.hasError()).toEqual(false);
        assertHeading('Status: Unhealthy', 'text-warning');
    });
});