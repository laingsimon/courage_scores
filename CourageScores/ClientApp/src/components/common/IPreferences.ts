import { PreferenceValue } from './PreferencesContainer';

export interface IPreferences {
    getPreference<T>(name: string): T | undefined;
    upsertPreference(name: string, value?: PreferenceValue): void;
}
