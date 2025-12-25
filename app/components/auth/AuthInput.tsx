import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { COLORS } from '../../constants/colors';

interface AuthInputProps extends TextInputProps {
  label: string;
}

export default function AuthInput({ label, style, ...props }: AuthInputProps) {
  return (
    <View style={{ marginBottom: 15, width: '100%' }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor="#999"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 5,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 2,
    borderColor: COLORS.primaryGreen,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.textDark,
  },
});