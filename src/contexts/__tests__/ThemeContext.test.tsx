import React, { useEffect } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { ThemeProvider, useTheme, type Theme } from '../ThemeContext';

const THEME_KEY = 'ai-foundry-manager:theme';

type MediaQueryListener = () => void;

const setupMatchMedia = (initialMatches: boolean) => {
  let matches = initialMatches;
  const listeners = new Set<MediaQueryListener>();

  const matchMedia = ((query: string) => {
    if (query !== '(prefers-color-scheme: dark)') {
      throw new Error(`Unexpected media query: ${query}`);
    }

    return {
      matches,
      media: query,
      addEventListener: (_: 'change', cb: MediaQueryListener) =>
        listeners.add(cb),
      removeEventListener: (_: 'change', cb: MediaQueryListener) =>
        listeners.delete(cb),
      dispatch: () => listeners.forEach((cb) => cb()),
    };
  }) as unknown as typeof window.matchMedia;

  (window as unknown as { matchMedia: typeof window.matchMedia }).matchMedia =
    matchMedia;

  return {
    setMatches(next: boolean) {
      matches = next;
      const mql = matchMedia('(prefers-color-scheme: dark)');
      (mql as unknown as { dispatch: () => void }).dispatch();
    },
  };
};

const ThemeSetter = ({ theme }: { theme: Theme }) => {
  const { setTheme } = useTheme();
  useEffect(() => {
    setTheme(theme);
  }, [setTheme, theme]);
  return null;
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark', 'light');
  });

  it('applies light theme when stored preference is light', () => {
    localStorage.setItem(THEME_KEY, 'light');
    setupMatchMedia(true);

    render(
      <ThemeProvider>
        <div />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('resolves system theme to light when OS prefers light', () => {
    localStorage.setItem(THEME_KEY, 'system');
    setupMatchMedia(false);

    render(
      <ThemeProvider>
        <div />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('updates resolved theme when OS preference changes in system mode', () => {
    localStorage.setItem(THEME_KEY, 'system');
    const media = setupMatchMedia(false);

    render(
      <ThemeProvider>
        <div />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('light')).toBe(true);

    act(() => {
      media.setMatches(true);
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('persists theme changes to localStorage', () => {
    setupMatchMedia(true);

    render(
      <ThemeProvider>
        <ThemeSetter theme="light" />
      </ThemeProvider>
    );

    expect(localStorage.getItem(THEME_KEY)).toBe('light');
  });
});
