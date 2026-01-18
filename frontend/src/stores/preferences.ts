import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    taskReminders: boolean;
    dueDateReminders: boolean;
    comments: boolean;
  };
  language: string;
  timezone?: string;
}

const defaultPreferences: UserPreferences = {
  notifications: {
    email: true,
    push: true,
    taskReminders: true,
    dueDateReminders: true,
    comments: true,
  },
  language: "vi",
};

// Persist user preferences in localStorage
export const userPreferencesAtom = atomWithStorage<UserPreferences>(
  "user-preferences",
  defaultPreferences
);

// Individual atoms for easier access
export const notificationPreferencesAtom = atom(
  (get) => get(userPreferencesAtom).notifications,
  (get, set, update: Partial<UserPreferences["notifications"]>) => {
    const prefs = get(userPreferencesAtom);
    set(userPreferencesAtom, {
      ...prefs,
      notifications: { ...prefs.notifications, ...update },
    });
  }
);

export const languageAtom = atom(
  (get) => get(userPreferencesAtom).language,
  (get, set, language: string) => {
    const prefs = get(userPreferencesAtom);
    set(userPreferencesAtom, { ...prefs, language });
  }
);
