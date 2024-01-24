import {act, fireEvent} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import {IocContainer, IIocContainerProps} from "../IocContainer";
import {AppContainer, IAppContainerProps} from "../AppContainer";
import ReactDOM from "react-dom/client";
import React, {Dispatch, SetStateAction} from "react";
import {BrandingContainer, IBrandingContainerProps} from "../BrandingContainer";
import {UserEvent} from "@testing-library/user-event/setup/setup";
import {IError} from "../interfaces/IError";
import {Settings} from "../api/settings";
import {ISubscriptions} from "../interfaces/ISubscriptions";

/* istanbul ignore file */

export async function doClick(container: Element, selector?: string) {
    const item = selector ? container.querySelector(selector) : container;
    expect(item).toBeTruthy();
    const anyItem: any = item;
    expect(anyItem!.disabled || false).toEqual(false);
    const clickEvent = new MouseEvent('click', {bubbles: true});
    await act(async () => {
        item!.dispatchEvent(clickEvent);
    });
}

export async function doChange(container: Element, selector: string, text: string, user: UserEvent) {
    const input = container.querySelector(selector);
    if (!input) {
        throw new Error(`Could not find element with selector ${selector} in ${container.innerHTML}`);
    }

    fireEvent.change(input, {target: {value: text}});
    if (!user) {
        throw new Error('user not available');
    }
    await user.type(input, '{Shift}'); //trigger the event handler again, but in an async manner
}

export async function setFile(container: Element, selector: string, file: any, user: UserEvent) {
    const input = container.querySelector(selector);
    if (!input) {
        throw new Error(`Could not find element with selector ${selector} in ${container.innerHTML}`);
    }

    fireEvent.change(input, {target: {files: [file]}});
    if (!user) {
        throw new Error('user not available');
    }
    await user.type(input, '{Shift}'); //trigger the event handler again, but in an async manner
}

export interface TestContext {
    container: HTMLElement,
    cleanUp: () => void
    user: UserEvent,
}

export function api<T>(methods: any): T {
    return Object.assign({}, methods) as any;
}

export function iocProps(props?: any) : IIocContainerProps {
    const mockWebSocketFactory = new MockSocketFactory();
    const defaultSettings = new Settings();

    const defaultProps: IIocContainerProps = {
        accountApi: {} as any,
        dataApi: {} as any,
        errorApi: {} as any,
        gameApi: {} as any,
        liveApi: {} as any,
        noteApi: {} as any,
        divisionApi: {} as any,
        parentHeight: {} as any,
        playerApi: {} as any,
        saygApi: {} as any,
        reportApi: {} as any,
        seasonApi: {} as any,
        settings: defaultSettings,
        teamApi: {} as any,
        templateApi: {} as any,
        tournamentApi: {} as any,
        socketFactory: mockWebSocketFactory.createSocket,
    } as any;
    return Object.assign({}, defaultProps, props);
}

export function brandingProps(props?: any): IBrandingContainerProps {
    const defaultProps: IBrandingContainerProps = {
        name: 'Courage Scores',
        facebook: '',
        twitter: '',
        menu: {
            afterDivisions: [],
            beforeDivisions: [],
        },
    };

    return Object.assign({}, defaultProps, props);
}

export class ErrorState {
    error?: any;

    setError(err: IError | string) {
        const error: IError = err as IError;
        if (error.message) {
            this.error = {
                message: error.message,
                stack: error.stack
            };
        } else {
            this.error = err as string;
        }
    }

    hasError(): boolean {
        return !!this.error;
    }
}

export class MockSocketFactory {
    subscriptions: ISubscriptions = {};
    sent: any[] = [];
    socket: WebSocket = null;
    createSocket = this.__createSocket.bind(this);
    socketWasCreated = this.__socketWasCreated.bind(this);

    __createSocket() {
        const socket: WebSocket = {
            close: () => {},
            readyState: 1,
            send: (data: any) => {
                const message = JSON.parse(data);
                if (message.type === 'subscribed') {
                    this.subscriptions[message.id] = { id: null, errorHandler: null, updateHandler: null };
                } else if (message.type === 'unsubscribed') {
                    delete this.subscriptions[message.id];
                }
                this.sent.push(message);
            },
            type: 'MockWebSocket',
        } as any;
        this.socket = socket;
        return socket;
    }

    __socketWasCreated() {
        return !!this.socket;
    }
}

export function appProps(props?: any, errorState?: ErrorState): IAppContainerProps {
    const defaultProps: IAppContainerProps = {
        account: null,
        appLoading: false,
        onError: (err: IError | string) => {
            if (errorState) {
                errorState.setError(err);
            }
        },
        error: null,
        build: {
            version: '',
            branch: '',
            date: '',
        },
        divisions: [],
        seasons: [],
        teams: [],
        clearError: noop,
        embed: false,
        controls: true,
        reportClientSideException: noop,
        invalidateCacheAndTryAgain: noop,
        reloadAccount: noop,
        reloadDivisions: noop,
        reloadAll: noop,
        reloadSeasons: noop,
        reloadTeams: noop,
    };

    return Object.assign({}, defaultProps, props);
}

export async function renderApp(iocProps: IIocContainerProps, brandingProps: IBrandingContainerProps, appProps: IAppContainerProps, content: React.ReactNode, route?: string, currentPath?: string, containerTag?: string): Promise<TestContext> {
    const container = document.createElement(containerTag || 'div') as HTMLElement;
    document.body.appendChild(container);

    if (!route) {
        route = '/test';
    }
    if (!currentPath) {
        currentPath = route;
    }

    const user = userEvent.setup();

    const currentPathAsInitialEntry: any = currentPath;
    await act(async () => {
        const component = (<MemoryRouter initialEntries={[currentPathAsInitialEntry]}>
            <Routes>
                <Route path={route} element={<IocContainer {...iocProps}>
                    <BrandingContainer {...brandingProps}>
                        <AppContainer {...appProps}>
                            {content}
                        </AppContainer>
                    </BrandingContainer>
                </IocContainer>}/>
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
        },
        user,
    };
}

export function cleanUp(context: TestContext) {
    if (context) {
        context.cleanUp();
    }
}

export function findButton(container: Element | undefined | null, text: string) {
    if (!container) {
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

export async function doSelectOption(container: Element | undefined | null, text: string) {
    if (!container) {
        throw new Error('Container not supplied');
    }

    if (!container.className || container.className.indexOf('dropdown-menu') === -1) {
        throw new Error('Container must be a dropdown menu');
    }

    const items = Array.from(container.querySelectorAll('.dropdown-item')) as HTMLElement[];
    const matchingItems = items.filter(i => i.textContent === text);
    if (matchingItems.length === 0) {
        throw new Error(`Could not find item with text: ${text}, possible options: ${items.map(i => `"${i.textContent}"`).join(', ')}`);
    }
    if (matchingItems.length > 1) {
        throw new Error(`${matchingItems.length} items match given text: ${text}`);
    }

    await doClick(matchingItems[0]);
}

export async function noop(): Promise<any> {
    // do nothing
}
