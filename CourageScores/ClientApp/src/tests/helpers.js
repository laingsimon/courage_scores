import {act, fireEvent} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {IocContainer} from "../IocContainer";
import {AppContainer} from "../AppContainer";
import ReactDOM from "react-dom/client";
import React from "react";

export async function doClick(container, selector) {
    const item = container.querySelector(selector);
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

export async function renderApp(iocProps, appProps, content) {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
        const component = (<MemoryRouter>
            <IocContainer {...iocProps}>
                <AppContainer {...appProps}>
                    {content}
                </AppContainer>
            </IocContainer>
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