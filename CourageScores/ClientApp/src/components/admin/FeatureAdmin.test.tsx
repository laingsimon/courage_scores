import {AdminContainer} from "./AdminContainer";
import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {ConfiguredFeatureDto} from "../../interfaces/models/dtos/ConfiguredFeatureDto";
import {IFeatureApi} from "../../interfaces/apis/IFeatureApi";
import {FeatureAdmin} from "./FeatureAdmin";
import {createTemporaryId} from "../../helpers/projection";

describe('FeatureAdmin', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let features: ConfiguredFeatureDto[];
    const featureApi = api<IFeatureApi>({
        async getFeatures(): Promise<ConfiguredFeatureDto[]> {
            return features;
        }
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        features = null;
    });

    async function renderComponent() {
        context = await renderApp(
            iocProps({featureApi}),
            brandingProps(),
            appProps({
                account: {},
            }, reportedError),
            (<AdminContainer tables={[]} accounts={[]}>
                <FeatureAdmin />
            </AdminContainer>));
    }

    describe('renders', () => {
        it('a list of features', async () => {
            features = [ {
                name: 'FEATURE 1',
                description: 'FEATURE 1 DESC',
                id: createTemporaryId(),
                valueType: 'String',
            } ];

            await renderComponent();

            expect(context.container.textContent).toContain('FEATURE 1');
        });
    });
});