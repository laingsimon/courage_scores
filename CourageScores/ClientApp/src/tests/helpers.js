import {act, fireEvent} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import {IocContainer} from "../IocContainer";
import {AppContainer} from "../AppContainer";
import ReactDOM from "react-dom/client";
import React from "react";

export async function doClick(container, selector) {
    const item = selector ? container.querySelector(selector) : container;
    // noinspection JSUnresolvedFunction
    expect(item).toBeTruthy();
    const clickEvent = new MouseEvent('click', { bubbles: true });
    await act(async () => {
        item.dispatchEvent(clickEvent);
    });
}

export function doChange(container, selector, text) {
    const input = container.querySelector(selector);
    // noinspection JSUnresolvedFunction
    expect(input).toBeTruthy();

    fireEvent.change(input, { target: { value: text } });
}

export async function renderApp(iocProps, appProps, content, route, currentPath, containerTag) {
    const container = document.createElement(containerTag || 'div');
    document.body.appendChild(container);

    if (!route) {
        route = '/test';
    }
    if (!currentPath) {
        currentPath = route;
    }

    await act(async () => {
        const component = (<MemoryRouter initialEntries={[currentPath]}>
            <Routes>
                <Route path={route} element={<IocContainer {...iocProps}>
                        <AppContainer {...appProps}>
                            {content}
                        </AppContainer>
                    </IocContainer>} />
            </Routes>
        </MemoryRouter>);
        ReactDOM.createRoot(container).render(component);
    });

    return {
        container: container,
        cleanUp: () => {
            if (container) {
                document.body.removeChild(container);
            }
        }
    };
}

export function cleanUp(context) {
    if (context) {
        context.cleanUp();
    }
}

export function findButton(container, text) {
    if (!container){
        throw new Error('Container is null');
    }
    const matching = Array.from(container.querySelectorAll('button')).filter(b => b.textContent === text);
    if (matching.length === 1) {
        return matching[0];
    }
    if (matching.length === 0) {
        throw new Error(`Unable to find button with text = ${text}`);
    }
    throw new Error(`Multiple buttons (${matching.length}) exist with text = ${text}`);
}