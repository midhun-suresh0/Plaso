import React, { createContext, useContext, ReactNode } from 'react';

/**
 * Application-wide context.
 * Foundation for future state management (auth, user data, etc.).
 */

interface AppContextType {
  appName: string;
  version: string;
}

const defaultContext: AppContextType = {
  appName: 'Plaso',
  version: '1.0.0',
};

const AppContext = createContext<AppContextType>(defaultContext);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps): React.JSX.Element {
  const value: AppContextType = {
    appName: 'Plaso',
    version: '1.0.0',
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextType {
  return useContext(AppContext);
}
