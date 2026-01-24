import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../../constants/colors';
import TransactionCard from '../../components/profile/transactionCard';

export default function VouchersScreen() {
  const router = useRouter();
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);

  // TODO récupérer les données du user
  const vouchers = [
    {
      id: '1',
      store: '[Nom magasin]',
      color: '#BDE2EB',
      lines: [
        'Date d\'achat : 12/01/2024',
        'Date d\'expiration : 12/06/2024',
        'Montant : 15€'
      ]
    },
    {
      id: '2',
      store: '[Nom magasin]',
      color: COLORS.primaryGreen,
      lines: [
        'Date d\'achat : 15/01/2024',
        'Date d\'expiration : 15/07/2024',
        'Montant : 20€'
      ]
    },
    {
      id: '3',
      store: '[Nom magasin]',
      color: COLORS.primaryYellow, 
      lines: [
        'Date d\'achat : 20/01/2024',
        'Date d\'expiration : 20/05/2024',
        'Montant : 10€'
      ]
    }
  ];

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </Pressable>
        <Text style={styles.headerTitle}>Bons d’achats</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {vouchers.map((item) => (
          <TransactionCard
            key={item.id}
            title={item.store}
            color={item.color}
            lines={item.lines}
            onPress={() => setSelectedVoucher(item.id)}
          />
        ))}
      </ScrollView>

      {/* MODAL CODE BARRE */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedVoucher}
        onRequestClose={() => setSelectedVoucher(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedVoucher(null)}>
          <View style={styles.bottomSheet}>
            <Text style={styles.bottomSheetLabel}>Code barre</Text>
            <View style={styles.barcodeBox}>
              <Text style={styles.barcodeText}>[Code barre]</Text>
              {/* TODO affichage du code barre */}
            </View>
          </View>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 15,
  },
  bottomSheet: {
    backgroundColor: '#F9F9F9', 
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
  },
  bottomSheetLabel: {
    alignSelf: 'flex-start',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ccc',
    marginBottom: 15,
  },
  barcodeBox: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  barcodeText: {
    fontSize: 18,
    letterSpacing: 2,
  }
});