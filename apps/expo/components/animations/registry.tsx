import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState, type ComponentType } from 'react';
import { AuroraCurtainScreen } from './aurora-curtain';
import { BlurredTextMorphScreen } from './blurred-text-morph';
import { ChatGptAttachmentsScreen } from './chatgpt-attachments';
import { GalleryCarouselScreen } from './gallery-carousel';
import { RadialMenuScreen } from './radial-menu';
import { StackToastScreen } from './spring-toast';
import { VariableFontScreen } from './variable-font';

// Navigation stays outside the copyable example. Covered routes stop their
// frame callbacks while the standalone export works without Expo Router.
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

/**
 * Maps an animation slug to its self-contained demo screen. To add a new
 * animation: create a folder under `components/animations/<slug>/` exporting a
 * screen component, then register it here. No route changes required.
 */
export const animationScreens: Record<string, ComponentType> = {
  'aurora-curtain': AuroraCurtainScreen,
  'blurred-text-morph': BlurredTextMorphScreen,
  'chatgpt-attachments': ChatGptAttachmentsScreen,
  'gallery-carousel': GalleryCarouselScreen,
  'radial-menu': RadialMenuScreen,
  'spring-toast': StackToastScreen,
  'variable-font': VariableFontDemoScreen,
};
