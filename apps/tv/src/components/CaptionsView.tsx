import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CaptionCue } from '../types';

interface CaptionsViewProps {
  cue: CaptionCue | null;
  visible: boolean;
}

/**
 * Renders a subtitle overlay at the bottom of the video frame.
 * Only displayed when captions are enabled and a cue is active.
 */
export function CaptionsView({ cue, visible }: CaptionsViewProps) {
  if (!visible || !cue) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.backdrop}>
        <Text
          style={styles.text}
          accessibilityRole="text"
          accessibilityLabel={`Caption: ${cue.text}`}
        >
          {cue.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 8,
    maxWidth: '85%',
  },
  text: {
    color: '#F4F7FB',
    fontSize: 22,
    lineHeight: 30,
    textAlign: 'center',
  },
});
