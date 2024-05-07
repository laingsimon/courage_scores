import React, {createContext, useContext} from "react";
import {IPreferences} from "./IPreferences";
import {CookiesProvider, useCookies} from "react-cookie";

const PreferencesContext = createContext({});

export interface IPreferenceData {
    [ key: string]: any;
}

export function usePreferences(): IPreferences {
    return useContext(PreferencesContext) as IPreferences;
}

export interface IPreferencesContainerProps {
    children?: React.ReactNode;
}

/* istanbul ignore next */
export function PreferencesContainer({children} : IPreferencesContainerProps) {
    const COOKIE_NAME = 'preferences';
    const [ cookies, setCookie ] = useCookies([COOKIE_NAME]);

    function getPreference<T>(name: string): T | null {
        const preferences: IPreferenceData = cookies[COOKIE_NAME] || {};
        return preferences[name];
    }

    function upsertPreference<T>(name: string, value: T): void {
        const newPreferences: IPreferenceData = Object.assign({}, cookies[COOKIE_NAME]);

        if (!value) {
            delete newPreferences[name];
        } else {
            newPreferences[name] = value;
        }

        setCookie(COOKIE_NAME, newPreferences);
    }

    const preferenceAccessor: IPreferences = {
        getPreference,
        upsertPreference,
    };
    return (<PreferencesContext.Provider value={preferenceAccessor}>
        <CookiesProvider defaultSetOptions={ { path: '/' } }>
            {children}
        </CookiesProvider>
    </PreferencesContext.Provider>)
}