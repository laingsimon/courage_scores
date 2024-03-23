import {appProps, brandingProps, cleanUp, iocProps, renderApp, TestContext} from "../../helpers/tests";
import {renderDate} from "../../helpers/rendering";
import {FilterFixtures, IFilterFixturesProps} from "./FilterFixtures";
import {DivisionDataContainer, IDivisionDataContainerProps} from "../league/DivisionDataContainer";
import {teamBuilder} from "../../helpers/builders/teams";
import {IInitialisedFilters} from "../../helpers/filters";

describe('FilterFixtures', () => {
    let context: TestContext;

    afterEach(() => {
        cleanUp(context);
    });

    function divisionData(props: any): IDivisionDataContainerProps {
        return props as any;
    }

    async function setFilter(_: IInitialisedFilters) {
    }

    async function renderComponent(props: IFilterFixturesProps, divisionData: IDivisionDataContainerProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            (<DivisionDataContainer {...divisionData}>
                <FilterFixtures {...props}/>
            </DivisionDataContainer>));
    }

    describe('type', () => {
        it('when selected', async () => {
            await renderComponent({ filter: {type: 'league'}, setFilter }, divisionData({ teams: [] }));

            const dropDown = context.container.querySelector('.btn-group:nth-child(1)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('League fixtures');
        });

        it('when unrecognised', async () => {
            await renderComponent({ filter: {type: 'foo'}, setFilter }, divisionData({ teams: [] }));

            const dropDown = context.container.querySelector('.btn-group:nth-child(1)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeFalsy();
        });

        it('when unselected', async () => {
            await renderComponent({ filter: {}, setFilter }, divisionData({ teams: [] }));

            const dropDown = context.container.querySelector('.btn-group:nth-child(1)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('All fixtures');
        });
    });

    describe('date', () => {
        it('when selected', async () => {
            await renderComponent({ filter: {date: 'past'}, setFilter }, divisionData({ teams: [] }));

            const dropDown = context.container.querySelector('.btn-group:nth-child(2)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('Past dates');
        });

        it('when specific 3-part date', async () => {
            const date = '2023-01-01';
            const expectedDate = renderDate(date);
            await renderComponent({ filter: {date}, setFilter }, divisionData({ teams: [] }));

            const dropDown = context.container.querySelector('.btn-group:nth-child(2)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual(expectedDate);
        });

        it('when unrecognised', async () => {
            await renderComponent({ filter: {date: 'foo'}, setFilter }, divisionData({ teams: [] }));

            const dropDown = context.container.querySelector('.btn-group:nth-child(2)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('foo');
        });

        it('when unselected', async () => {
            await renderComponent({ filter: {}, setFilter }, divisionData({ teams: [] }));

            const dropDown = context.container.querySelector('.btn-group:nth-child(2)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('All dates');
        });
    });

    describe('team', () => {
        it('when selected', async () => {
            const team = teamBuilder('TEAM').build();
            await renderComponent({ filter: {team: 'TEAM'}, setFilter }, divisionData({ teams: [team] }));

            const dropDown = context.container.querySelector('.btn-group:nth-child(3)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('TEAM');
        });

        it('when unrecognised', async () => {
            const team = teamBuilder('TEAM').build();
            await renderComponent({ filter: {team: '1234'}, setFilter }, divisionData({ teams: [team] }));

            const dropDown = context.container.querySelector('.btn-group:nth-child(3)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeFalsy();
        });

        it('when unselected', async () => {
            await renderComponent({ filter: {}, setFilter }, divisionData({ teams: [] }));

            const dropDown = context.container.querySelector('.btn-group:nth-child(3)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('All teams');
        });
    });
});