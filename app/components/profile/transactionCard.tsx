import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type TransactionCardProps = {
  title: string;
  lines: string[];
  color: string;
  onPress?: () => void;
};

export default function TransactionCard({ title, lines, color, onPress }: TransactionCardProps) {
  const isClickable = !!onPress;
  const Container = isClickable ? Pressable : View;

  return (
    <Container 
      style={[styles.card, { backgroundColor: color }]} 
      onPress={onPress}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {lines.map((line, index) => (
          <Text key={index} style={styles.textLine}>{line}</Text>
        ))}
      </View>
      
      {isClickable && (
        <Ionicons name="chevron-forward" size={20} color="#333" style={styles.icon} />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  textLine: {
    fontSize: 13,
    color: '#444',
    marginBottom: 2,
    lineHeight: 18,
  },
  icon: {
    marginLeft: 10,
    opacity: 0.6,
  }
});