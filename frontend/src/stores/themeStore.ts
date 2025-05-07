import { create, StateCreator } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { ThemeConfig, defaultTheme } from '@/types/theme';

interface ThemeStore {
  theme: ThemeConfig;
  isPremium: boolean;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  resetTheme: () => void;
  setPremium: (isPremium: boolean) => void;
}

type ThemeStorePersist = (
  config: StateCreator<ThemeStore>,
  options: PersistOptions<ThemeStore>
) => StateCreator<ThemeStore>;

export const useThemeStore = create<ThemeStore>()(
  (persist as ThemeStorePersist)(
    (set): ThemeStore => ({
      theme: defaultTheme,
      isPremium: false,
      setTheme: (newTheme: Partial<ThemeConfig>) =>
        set((state: ThemeStore) => ({
          theme: {
            ...state.theme,
            ...newTheme,
          },
        })),
      resetTheme: () => set({ theme: defaultTheme }),
      setPremium: (isPremium: boolean) => set({ isPremium }),
    }),
    {
      name: 'theme-storage',
    }
  )
); 