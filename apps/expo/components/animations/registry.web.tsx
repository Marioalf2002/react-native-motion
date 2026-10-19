import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState, type ComponentType } from 'react';
import { VariableFontScreen } from './variable-font';

function VariableFontDemoScreen() {
  const [isActive, setIsActive] = useState(false);
  useFocusEffect(useCallback(() => {
    setIsActive(true);
    return () => setIsActive(false);
  }, []));

  return (
    <>
      {isActive ? <StatusBar style="dark" /> : null}
      <VariableFontScreen isActive={isActive} />
    </>
  );
}

// Native examples may initialize native renderers at module scope. Register
// verified browser demos here; the route's existing fallback handles the rest.
export const animationScreens: Record<string, ComponentType> = {
  'variable-font': VariableFontDemoScreen,
};
