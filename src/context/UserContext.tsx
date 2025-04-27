'use client';

import React, { createContext, useContext, useState } from 'react';

interface UserContextType {
  initialEmail: string | null;
  setInitialEmail: (email: string) => void;
}

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserContext = createContext({} as UserContextType);

function UserContextProvider({ children }: UserProviderProps) {

  const [initialEmail, setInitialEmail] = useState<string | null>(null);

  return (
    <UserContext.Provider
      value={{
        initialEmail,
        setInitialEmail,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

function useUser(): UserContextType {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export { useUser, UserContextProvider };
