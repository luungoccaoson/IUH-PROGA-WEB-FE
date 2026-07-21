import { create } from 'zustand';

type Theme = 'navy';

interface ThemeState {
  theme: Theme;
}

export const useThemeStore = create<ThemeState>(() => ({
  theme: 'navy',
}));
