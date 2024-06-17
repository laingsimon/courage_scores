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
    insecure?: boolean;
}

/* istanbul ignore next */
export function PreferencesContainer({children, insecure} : IPreferencesContainerProps) {
    const COOKIE_NAME = 'preferences';
    const [ cookies, setCookie ] = useCookies([COOKIE_NAME]);
    const EXPIRY_DAYS: number = 365;

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

        setCookie(
            COOKIE_NAME,
            newPreferences,
            {
                path: '/',
                expires: getExpiry(),
                secure: !insecure,
                sameSite: 'none',
                partitioned: true,
            });
    }

    function getExpiry(): Date {
        const now = new Date();
        const expires = new Date(now.valueOf());
        expires.setDate(now.getDate() + EXPIRY_DAYS);
        return expires;
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