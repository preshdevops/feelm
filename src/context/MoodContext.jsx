/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

const MoodContext = createContext(null);

export function MoodProvider({ children }) {
  const [activeMood, setActiveMood] = useState(null);

  const value = {
    activeMood,
    setActiveMood,
  };

  return <MoodContext.Provider value={value}>{children}</MoodContext.Provider>;
}

export function useMood() {
  const context = useContext(MoodContext);
  if (!context) {
    throw new Error('useMood must be used within a MoodProvider');
  }
  return context;
}
