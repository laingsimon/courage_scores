import React, {createContext, useContext, useState} from "react";
import {IPreferences} from "./IPreferences";

const PreferencesContext = createContext({});

export interface IPreferenceData {
    [ key: string]: any;
}

export function usePreferences(): IPreferences {
    return useContext(PreferencesContext) as IPreferences;
}

export interface IPreferencesContainerProps {
    children?: React.ReactNode;
    initialPreferences?: IPreferenceData;
}

/* istanbul ignore next */
export function PreferencesContainer({children, initialPreferences} : IPreferencesContainerProps) {
    const [ preferences, updatePreferences ] = useState<IPreferenceData>(initialPreferences || {});

    function getPreference<T>(name: string): T | null {
        return preferences[name];
    }

    function upsertPreference<T>(name: string, value: T): void {
        const newPreferences: IPreferenceData = Object.assign({}, preferences);

        if (!value) {
            delete newPreferences[name];
        } else {
            newPreferences[name] = value;
        }

        updatePreferences(newPreferences);
    }

    const preferenceAccessor: IPreferences = {
        getPreference,
        upsertPreference,
    };
    return (<PreferencesContext.Provider value={preferenceAccessor}>
        {children}
    </PreferencesContext.Provider>)
}