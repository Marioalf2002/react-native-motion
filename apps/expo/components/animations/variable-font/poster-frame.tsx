import { StyleSheet, View } from 'react-native';

import { PALETTE } from './palette';
import type { PosterFrameProps } from './poster-frame.types';

export function PosterFrame({ children, inset }: PosterFrameProps) {
  return (
    <View testID="specimen-screen" style={[styles.page, { padding: inset }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: PALETTE.paper },
});
