export interface IPreferences {
    getPreference<T>(name: string): T | null;
    upsertPreference<T>(name: string, value: T): void;
}