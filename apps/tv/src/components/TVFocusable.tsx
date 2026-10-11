import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

interface TVFocusableProps {
  label: string;
  onPress: () => void;
  preferred?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  focusedStyle?: ViewStyle;
  children?: React.ReactNode;
}

export function TVFocusable({
  label,
  onPress,
  preferred = false,
  disabled = false,
  style,
  focusedStyle,
  children,
}: TVFocusableProps) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hasTVPreferredFocus={preferred}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      style={[
        styles.base,
        style,
        focused && styles.focused,
        focused && focusedStyle,
        disabled && styles.disabled,
      ]}
    >
      {children ?? <Text style={styles.text}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#162235',
    borderColor: '#162235',
    borderWidth: 3,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  focused: {
    borderColor: '#FFD166',
    backgroundColor: '#243950',
    transform: [{ scale: 1.04 }],
  },
  disabled: { opacity: 0.4 },
  text: { color: '#F4F7FB', fontSize: 16, fontWeight: '600' },
});
