import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextData {
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  toggleHighContrast: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextData>({} as AccessibilityContextData);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('@sus_natal:contrast') === 'true';
  });

  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>(() => {
    return (localStorage.getItem('@sus_natal:fontsize') as any) || 'normal';
  });

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    localStorage.setItem('@sus_natal:contrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.classList.remove('text-base', 'text-lg', 'text-xl');
    if (fontSize === 'large') {
      document.documentElement.classList.add('text-lg');
    } else if (fontSize === 'xlarge') {
      document.documentElement.classList.add('text-xl');
    } else {
      document.documentElement.classList.add('text-base');
    }
    localStorage.setItem('@sus_natal:fontsize', fontSize);
  }, [fontSize]);

  const toggleHighContrast = () => setHighContrast((prev) => !prev);

  const increaseFontSize = () => {
    setFontSize((prev) => (prev === 'normal' ? 'large' : 'xlarge'));
  };

  const decreaseFontSize = () => {
    setFontSize((prev) => (prev === 'xlarge' ? 'large' : 'normal'));
  };

  const resetFontSize = () => setFontSize('normal');

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        fontSize,
        toggleHighContrast,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility deve ser utilizado dentro de um AccessibilityProvider');
  }
  return context;
}
