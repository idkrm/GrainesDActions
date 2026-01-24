import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import TransactionCard from '../../components/profile/transactionCard';

export default function TransactionsScreen() {
  const router = useRouter();

  // TODO récupérer l'historique dynamiquement
  const historyItems = [
    {
      id: '1',
      title: '[Nom magasin]',
      color: '#BDE2EB', 
      lines: [
        'Date d\'achat : 10/01/2024',
        'Date d\'expiration : 10/06/2024',
        'Date d\'utilisation : 15/01/2024',
        'Montant : 5€'
      ]
    },
    {
      id: '2',
      title: 'Donations',
      color: '#65B369', 
      lines: [
        'Date d\'achat : 05/01/2024',
        'Association : WWF',
        'Montant : 10€'
      ]
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </Pressable>
        <Text style={styles.headerTitle}>Historique</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {historyItems.map((item) => (
          <TransactionCard
            key={item.id}
            title={item.title}
            color={item.color}
            lines={item.lines}
          />
        ))}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 30 },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
});