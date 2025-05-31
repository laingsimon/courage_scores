import {appProps, brandingProps, cleanUp, iocProps, renderApp, TestContext} from "../../helpers/tests";
import {IPrintDivisionHeadingProps, PrintDivisionHeading} from "./PrintDivisionHeading";
import {DivisionDataContainer, IDivisionDataContainerProps} from "./DivisionDataContainer";
import {divisionBuilder, divisionDataBuilder} from "../../helpers/builders/divisions";
import {createTemporaryId} from "../../helpers/projection";

describe('PrintDivisionHeading', () => {
    let context: TestContext;

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(props: IPrintDivisionHeadingProps, divisionData : IDivisionDataContainerProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <DivisionDataContainer {...divisionData}>
                <PrintDivisionHeading {...props} />
            </DivisionDataContainer>);
    }

    describe('when data missing', () => {
        it('renders nothing when no season', async () => {
            await renderComponent({
                hideDivision: false
            }, divisionDataBuilder(divisionBuilder('DIVISION').build()).build());

            expect(context.container.textContent).toEqual('');
        });

        it('renders nothing when no division and division included', async () => {
            await renderComponent({
                hideDivision: false
            }, divisionDataBuilder().season().build());

            expect(context.container.textContent).toEqual('');
        });

        it('renders nothing when no division and division excluded', async () => {
            await renderComponent({
                hideDivision: true
            }, divisionDataBuilder().season(s => s, createTemporaryId(), 'SEASON').build());

            expect(context.container.textContent).toEqual('SEASON');
        });
    })

    describe('when season and division present', () => {
        const divisionData = divisionDataBuilder()
            .name('DIVISION')
            .season(s => s, createTemporaryId(), 'SEASON')
            .build();

        it('shows division name', async () => {
            await renderComponent({
                hideDivision: false
            }, divisionData);

            expect(context.container.textContent).toEqual('DIVISION, SEASON');
        });

        it('excludes division name', async () => {
            await renderComponent({
                hideDivision: true
            }, divisionData);

            expect(context.container.textContent).toEqual('SEASON');
        });
    });
});