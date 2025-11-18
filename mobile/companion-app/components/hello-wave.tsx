import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { typography, spacing } from '@/src/theme/designTokens';

export function HelloWave() {
  return (
    <Animated.Text
      style={[
        styles.wave,
        {
          animationName: {
            '50%': { transform: [{ rotate: '25deg' }] },
          },
          animationIterationCount: 4,
          animationDuration: '300ms',
        },
      ]}
    >
      👋
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  wave: {
    fontSize: typography.display.fontSize - 4,
    lineHeight: typography.display.lineHeight,
    marginTop: -spacing.xs,
  },
});
