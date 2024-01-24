import {appProps, brandingProps, cleanUp, iocProps, renderApp, TestContext} from "../../../helpers/tests";
import React from "react";
import {IWidescreenSaygRecentThrowProps, WidescreenSaygRecentThrow} from "./WidescreenSaygRecentThrow";

describe('WidescreenSaygRecentThrow', () => {
    let context: TestContext;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props: IWidescreenSaygRecentThrowProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <WidescreenSaygRecentThrow {...props} />);
    }

    async function getClassName(props: IWidescreenSaygRecentThrowProps) {
        await renderComponent(props);

        const element = context.container.querySelector('div');
        return element.className;
    }

    describe('renders', () => {
        it('less than 100', async () => {
            const className = await getClassName({ score: 99, throwNumber: 1 });

            expect(className).not.toContain('text-danger');
        });

        it('100+ in red', async () => {
            const className = await getClassName({ score: 100, throwNumber: 1 });

            expect(className).toContain('text-danger');
        });

        it('180s in bold red', async () => {
            const className = await getClassName({ score: 180, throwNumber: 1 });

            expect(className).toContain('text-danger');
            expect(className).toContain('fw-bold');
        });

        it('busts with line through', async () => {
            const className = await getClassName({ bust: true, score: 50, throwNumber: 1 });

            expect(className).toContain('text-decoration-line-through');
        });

        it('most recent score with largest font size', async () => {
            const className = await getClassName({ throwNumber: 1, score: 1 });

            expect(className).toContain('fs-1');
            expect(className).toContain('opacity-100');
        });

        it('second most recent score with large font size', async () => {
            const className = await getClassName({ throwNumber: 2, score: 1 });

            expect(className).toContain('fs-2');
            expect(className).toContain('opacity-75');
        });

        it('third most recent score with medium-large font size', async () => {
            const className = await getClassName({ throwNumber: 3, score: 1 });

            expect(className).toContain('fs-3');
            expect(className).toContain('opacity-50');
        });

        it('fourth most recent score with medium font size', async () => {
            const className = await getClassName({ throwNumber: 4, score: 1 });

            expect(className).toContain('fs-4');
            expect(className).toContain('opacity-50');
        });

        it('firth most recent score with large font size', async () => {
            const className = await getClassName({ throwNumber: 5, score: 1 });

            expect(className).toContain('fs-5');
            expect(className).toContain('opacity-25');
        });

        it('sixth most recent score with large font size', async () => {
            const className = await getClassName({ throwNumber: 6, score: 1 });

            expect(className).toContain('fs-5');
            expect(className).toContain('opacity-25');
        });
    });
});