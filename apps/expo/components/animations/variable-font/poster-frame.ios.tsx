import { Host } from '@expo/ui';
import { ConcentricRectangle } from '@expo/ui/swift-ui';
import { foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import MaskedView from '@react-native-masked-view/masked-view';
import type { ComponentType, ReactElement } from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { PALETTE } from './palette';
import type { PosterFrameProps } from './poster-frame.types';

const NativeMaskedView = MaskedView as unknown as ComponentType<ViewProps & { maskElement: ReactElement }>;

export function PosterFrame({ children, inset }: PosterFrameProps) {
  return (
    <View testID="specimen-screen" style={[styles.page, { padding: inset }]}>
      {Number.parseInt(String(Platform.Version), 10) >= 26 ? (
        <NativeMaskedView style={styles.content} maskElement={
          <Host ignoreSafeArea="all" style={styles.content}>
            <ConcentricRectangle modifiers={[foregroundStyle('#ffffff')]} />
          </Host>
        }>
          {children}
        </NativeMaskedView>
      ) : children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: PALETTE.paper },
  content: { flex: 1 },
});
