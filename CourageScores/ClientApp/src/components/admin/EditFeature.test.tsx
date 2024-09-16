import {AdminContainer} from "./AdminContainer";
import {
    api,
    appProps,
    brandingProps,
    cleanUp, doChange, doClick,
    ErrorState, findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {ReconfigureFeatureDto} from "../../interfaces/models/dtos/ReconfigureFeatureDto";
import {ConfiguredFeatureDto} from "../../interfaces/models/dtos/ConfiguredFeatureDto";
import {IFeatureApi} from "../../interfaces/apis/IFeatureApi";
import {EditFeature, IEditFeatureProps} from "./EditFeature";
import {createTemporaryId} from "../../helpers/projection";

describe('EditFeature', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updateRequest: ReconfigureFeatureDto;
    let apiResponse: IClientActionResultDto<ConfiguredFeatureDto>;
    let changed: boolean;
    const featureApi = api<IFeatureApi>({
        async updateFeature(update: ReconfigureFeatureDto): Promise<IClientActionResultDto<ConfiguredFeatureDto>> {
            updateRequest = update;
            return apiResponse || { success: true };
        }
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    async function onChanged() {
        changed = true;
    }

    beforeEach(() => {
        reportedError = new ErrorState();
        apiResponse = null;
        updateRequest = null;
        changed = false;
    });

    async function renderComponent(props: IEditFeatureProps) {
        context = await renderApp(
            iocProps({featureApi}),
            brandingProps(),
            appProps({
                account: {},
            }, reportedError),
            (<AdminContainer tables={[]} accounts={[]}>
                <EditFeature {...props} />
            </AdminContainer>));
    }

    describe('renders', () => {
        it('when configured', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: 'FOO',
                valueType: 'String',
            };

            await renderComponent({ feature, onChanged });

            expect(context.container.textContent).toContain('FEATURE 1');
            expect(context.container.textContent).toContain('FEATURE DESC');
            expect(context.container.querySelector('input').value).toEqual('FOO');
        });

        it('when unconfigured', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: null,
                valueType: 'String',
            };

            await renderComponent({ feature, onChanged });

            expect(context.container.textContent).toContain('FEATURE 1');
            expect(context.container.textContent).toContain('FEATURE DESC');
            expect(context.container.querySelector('input').value).toEqual('');
        });

        it('boolean feature', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: 'true',
                valueType: 'Boolean',
            };

            await renderComponent({ feature, onChanged });

            const input = context.container.querySelector('input');
            expect(input.type).toEqual('checkbox');
            expect(input.checked).toEqual(true);
        });

        it('unconfigured, default ON boolean feature', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: null,
                defaultValue: 'true',
                valueType: 'Boolean',
            };

            await renderComponent({ feature, onChanged });

            const input = context.container.querySelector('input');
            expect(input.type).toEqual('checkbox');
            expect(input.checked).toEqual(true);
        });

        it('integer feature', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: '5',
                valueType: 'Integer',
            };

            await renderComponent({ feature, onChanged });

            const input = context.container.querySelector('input');
            expect(input.type).toEqual('number');
            expect(input.value).toEqual('5');
        });

        it('decimal feature', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: '5.3',
                valueType: 'Decimal',
            };

            await renderComponent({ feature, onChanged });

            const input = context.container.querySelector('input');
            expect(input.type).toEqual('text');
            expect(input.value).toEqual('5.3');
            expect(input.placeholder).toEqual('A decimal number');
        });

        it('string feature', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: 'FOO',
                valueType: 'String',
            };

            await renderComponent({ feature, onChanged });

            const input = context.container.querySelector('input');
            expect(input.type).toEqual('text');
            expect(input.value).toEqual('FOO');
            expect(input.placeholder).toEqual('text');
        });

        it('time-only timespan feature', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: '01:02:03',
                valueType: 'TimeSpan',
            };

            await renderComponent({ feature, onChanged });

            const day: HTMLInputElement = context.container.querySelector('input[name="day"]');
            const time: HTMLInputElement = context.container.querySelector('input[name="time"]');
            expect(day.type).toEqual('number');
            expect(day.value).toEqual('0');
            expect(day.placeholder).toEqual('days');
            expect(time.type).toEqual('time');
            expect(time.value).toEqual('01:02:03');
        });

        it('day-and-time timespan feature', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: '1.02:03:04',
                valueType: 'TimeSpan',
            };

            await renderComponent({ feature, onChanged });

            const day: HTMLInputElement = context.container.querySelector('input[name="day"]');
            const time: HTMLInputElement = context.container.querySelector('input[name="time"]');
            expect(day.type).toEqual('number');
            expect(day.value).toEqual('1');
            expect(day.placeholder).toEqual('days');
            expect(time.type).toEqual('time');
            expect(time.value).toEqual('02:03:04');
        });

        it('unknown feature', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: 'FOO',
                valueType: 'Unknown',
            };

            await renderComponent({ feature, onChanged });

            const input = context.container.querySelector('input');
            expect(input.type).toEqual('text');
            expect(input.value).toEqual('FOO');
            expect(input.placeholder).toEqual('A unknown');
        });
    });

    describe('interactivity', () => {
        it('can configure a feature', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: null,
                valueType: 'String',
            };
            await renderComponent({ feature, onChanged });

            await doChange(context.container, 'input', 'FOO', context.user);
            await doClick(findButton(context.container, '💾'));

            expect(updateRequest).toEqual({
                id: feature.id,
                configuredValue: 'FOO',
            });
        });

        it('can reconfigure a feature', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: 'FOO',
                valueType: 'String',
            };
            await renderComponent({ feature, onChanged });

            await doChange(context.container, 'input', 'BAR', context.user);
            await doClick(findButton(context.container, '💾'));

            expect(updateRequest).toEqual({
                id: feature.id,
                configuredValue: 'BAR',
            });
        });

        it('can unconfigure a feature', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: 'FOO',
                valueType: 'String',
            };
            await renderComponent({ feature, onChanged });

            await doChange(context.container, 'input', '', context.user);
            await doClick(findButton(context.container, '💾'));

            expect(updateRequest).toEqual({
                id: feature.id,
                configuredValue: null,
            });
        });

        it('unconfigures a feature when set to default value', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: 'FOO',
                defaultValue: 'BAR',
                valueType: 'String',
            };
            await renderComponent({ feature, onChanged });

            await doChange(context.container, 'input', 'BAR', context.user);
            await doClick(findButton(context.container, '💾'));

            expect(updateRequest).toEqual({
                id: feature.id,
                configuredValue: null,
            });
        });

        it('reconfigures a boolean feature - to ON', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: null,
                defaultValue: 'false',
                valueType: 'Boolean',
            };
            await renderComponent({ feature, onChanged });

            await doClick(context.container, 'input');
            await doClick(findButton(context.container, '💾'));

            expect(updateRequest).toEqual({
                id: feature.id,
                configuredValue: 'true',
            });
        });

        it('reconfigures a boolean feature - to OFF', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: 'true',
                defaultValue: null,
                valueType: 'Boolean',
            };
            await renderComponent({ feature, onChanged });

            await doClick(context.container, 'input');
            await doClick(findButton(context.container, '💾'));

            expect(updateRequest).toEqual({
                id: feature.id,
                configuredValue: 'false',
            });
        });

        it('reconfigures a timespan feature - by day', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: '00:00:00',
                defaultValue: null,
                valueType: 'TimeSpan',
            };
            await renderComponent({ feature, onChanged });

            await doChange(context.container, 'input[name="day"]', '2', context.user);
            await doClick(findButton(context.container, '💾'));

            expect(updateRequest).toEqual({
                id: feature.id,
                configuredValue: '2.00:00:00',
            });
        });

        it('reconfigures a timespan feature - by time', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: '00:00:00',
                defaultValue: null,
                valueType: 'TimeSpan',
            };
            await renderComponent({ feature, onChanged });

            await doChange(context.container, 'input[name="time"]', '01:02:03', context.user);
            await doClick(findButton(context.container, '💾'));

            expect(updateRequest).toEqual({
                id: feature.id,
                configuredValue: '01:02:03',
            });
        });

        it('refreshes features when save successful', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: null,
                valueType: 'String',
            };
            await renderComponent({ feature, onChanged });

            await doChange(context.container, 'input', 'FOO', context.user);
            await doClick(findButton(context.container, '💾'));

            expect(changed).toEqual(true);
        });

        it('reports an error if unable to change', async () => {
            const feature: ConfiguredFeatureDto = {
                name: 'FEATURE 1',
                description: 'FEATURE DESC',
                id: createTemporaryId(),
                configuredValue: null,
                valueType: 'String',
            };
            await renderComponent({ feature, onChanged });
            apiResponse = {
                success: false,
                warnings: [
                    'SOME ERROR',
                ],
            };

            await doChange(context.container, 'input', 'FOO', context.user);
            await doClick(findButton(context.container, '💾'));

            reportedError.verifyErrorEquals(['SOME ERROR']);
            expect(changed).toEqual(false);
        });
    });
});