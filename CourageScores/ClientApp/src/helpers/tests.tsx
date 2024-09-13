import {act, fireEvent} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import {IocContainer, IIocContainerProps} from "../components/common/IocContainer";
import {AppContainer, IAppContainerProps} from "../components/common/AppContainer";
import ReactDOM from "react-dom/client";
import {BrandingContainer, IBrandingContainerProps} from "../components/common/BrandingContainer";
import {UserEvent} from "@testing-library/user-event/setup/setup";
import {IError} from "../components/common/IError";
import {ISubscriptions} from "../live/ISubscriptions";
import {IParentHeight} from "../components/layout/ParentHeight";
import {IHttp} from "../api/http";
import {ReactNode, useEffect} from "react";
import {MessageType} from "../interfaces/models/dtos/MessageType";
import {IPreferenceData, PreferencesContainer} from "../components/common/PreferencesContainer";
import {Cookies, useCookies} from "react-cookie";

/* istanbul ignore file */

export async function doClick(container: Element, selector?: string, ignoreDisabledCheck?: boolean) {
    const item = selector ? container.querySelector(selector) : container;
    if (!item) {
        throw new Error(`Element to click was not found: ${selector || (container ? container.innerHTML : '<no container>')}`)
    }
    const anyItem: any = item;
    if (!ignoreDisabledCheck) {
        expect(anyItem!.disabled || false).toEqual(false);
    }
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

export async function doKeyPress(container: Element, key: string) {
    const keyboardEvent = new KeyboardEvent('keyup', { bubbles: true, key: key });
    await act(async () => {
        container!.dispatchEvent(keyboardEvent);
    });
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
    container: HTMLElement;
    cleanUp(): Promise<any>;
    user: UserEvent;
    cookies: Cookies;
}

export function api<T>(methods: Partial<T>): T {
    return Object.assign({}, methods) as T;
}

export function iocProps(props?: any) : IIocContainerProps {
    const mockWebSocketFactory = new MockSocketFactory();
    const mockParentHeight: IParentHeight = {
        cancelInterval() {
        },
        publishContentHeight() {
        },
        setupInterval(_?: number) {
        }
    };
    const mockHttp: IHttp = {
        get(relativeUrl: string): any {
            throw new Error(`GET ${relativeUrl} attempted; mock api should be injected`);
        },
        delete(relativeUrl: string, _?: any): any {
            throw new Error(`DELETE ${relativeUrl} attempted; mock api should be injected`);
        },
        put(relativeUrl: string, _: any): any {
            throw new Error(`PUT ${relativeUrl} attempted; mock api should be injected`);
        },
        patch(relativeUrl: string, _: any): any {
            throw new Error(`PATCH ${relativeUrl} attempted; mock api should be injected`);
        },
        post(relativeUrl: string, _: any): any {
            throw new Error(`POST ${relativeUrl} attempted; mock api should be injected`);
        }
    }

    const defaultProps: IIocContainerProps = {
        overrideHttp: mockHttp,
        overrideParentHeight: mockParentHeight,
        socketFactory: mockWebSocketFactory.createSocket,
    };
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

    verifyNoError(): void {
        expect(this.error).toBeFalsy();
    }

    verifyErrorEquals(expected: any) {
        expect(this.error).toBeTruthy();
        expect(this.error).toEqual(expected);
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
                if (message.type === MessageType.subscribed) {
                    this.subscriptions[message.id] = { id: null, type: null, errorHandler: null, updateHandler: null };
                } else if (message.type === MessageType.unsubscribed) {
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
        browser: {
            mobile: false,
            tv: false,
        },
    };

    return Object.assign({}, defaultProps, props);
}

export async function renderApp(iocProps: IIocContainerProps, brandingProps: IBrandingContainerProps, appProps: IAppContainerProps, content: ReactNode, route?: string, currentPath?: string, containerTag?: string, initialPreferences?: IPreferenceData): Promise<TestContext> {
    const container = document.createElement(containerTag || 'div') as HTMLElement;
    document.body.appendChild(container);

    if (!route) {
        route = '/test';
    }
    if (!currentPath) {
        currentPath = route;
    }

    const user = userEvent.setup();
    const cookies = new Cookies();
    cookies.update();

    const currentPathAsInitialEntry: any = currentPath;
    let root: ReactDOM.Root;
    await act(async () => {
        const component = (<MemoryRouter initialEntries={[currentPathAsInitialEntry]}>
            <Routes>
                <Route path={route} element={<IocContainer {...iocProps}>
                    <BrandingContainer {...brandingProps}>
                        <AppContainer {...appProps}>
                            <ReplaceCookieOnLoad cookieName="preferences" cookieValue={initialPreferences}>
                                <PreferencesContainer insecure={true}>
                                    {content}
                                </PreferencesContainer>
                            </ReplaceCookieOnLoad>
                        </AppContainer>
                    </BrandingContainer>
                </IocContainer>}/>
            </Routes>
        </MemoryRouter>);
        root = ReactDOM.createRoot(container);
        root.render(component);
    });

    return {
        container: container,
        cleanUp: async () => {
            await act(async () => {
                root.unmount();
            });
            if (container && document && document.body) {
                document.body.removeChild(container);
            }
        },
        user,
        cookies: cookies,
    };
}

function ReplaceCookieOnLoad({ cookieName, cookieValue, children }) {
    const [ _, setCookie, removeCookie ] = useCookies([cookieName]);

    useEffect(() => {
            // clear the cookie on load
            if (cookieValue) {
                setCookie(cookieName, cookieValue);
            } else {
                removeCookie(cookieName);
            }
        },
        []);

    return (<>{children}</>);
}

export async function cleanUp(context: TestContext): Promise<any> {
    if (context) {
        await context.cleanUp();
    }
}

export function findButton(container: Element | undefined | null, text: string) {
    if (!container) {
        throw new Error('Container is null');
    }
    const matching = Array.from(container.querySelectorAll('.btn')).filter(b => b.textContent === text);
    if (matching.length === 1) {
        return matching[0];
    }
    if (matching.length === 0) {
        const buttons = Array.from(container.querySelectorAll('.btn')).map(b => b.textContent).join(', ');

        throw new Error(`Unable to find button with text = ${text} - buttons are ${buttons}`);
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
