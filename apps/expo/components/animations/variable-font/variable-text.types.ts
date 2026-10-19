import type { TextProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

export type VariableTextProps = {
  text: string;
  size: number;
  frameWidth?: SharedValue<number>;
  x: SharedValue<number>;
  y: SharedValue<number>;
  visible?: SharedValue<boolean>;
  onLayout?: TextProps['onLayout'];
};
