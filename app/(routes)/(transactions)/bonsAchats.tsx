import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import TransactionCard from '../../components/profile/transactionCard';

// IMPORTS FIREBASE
import { doc, getDoc } from 'firebase/firestore';
import { auth, database } from "../../firebaseConfig";

type BonAchat = {
  id: string; 
  title: string;
  color: string;
  lines: string[];
  date_achat: string;
  codeBarre?: string;
};

export default function VouchersScreen() {
  const router = useRouter();
  
  const [vouchers, setVouchers] = useState<BonAchat[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<BonAchat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // recup du document de l'utilisation
        const userDocRef = doc(database, "Users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          // recup tableau recompense
          const rawRewards = userData.recompense || [];

          const info = await Promise.all(rawRewards.map(async (item: any) => {
            
            // recup info des recompenses (nom magasion, montant)
            let nomRecompense = "Récompense";
            let montantRecompense; 

            if (item.id_recompense) {
              const recRef = doc(database, "Recompenses", String(item.id_recompense));
              const recSnap = await getDoc(recRef);
              if (recSnap.exists()) {
                const recData = recSnap.data();
                nomRecompense = recData.nom;
                montantRecompense = recData.montant || "0"; 
              }
            }

            // garde seulement les bons d'achats
            const lowerName = nomRecompense.toLowerCase();
            if (lowerName.includes('don') || lowerName.includes('arbre') || lowerName.includes('plantation')) {
              return null;
            }

            // nom magasin
            let nomMagasin = "Magasin inconnu";
            if (item.id_magasin) {
              const magRef = doc(database, "Magasins", String(item.id_magasin));
              const magSnap = await getDoc(magRef);
              if (magSnap.exists()) {
                nomMagasin = magSnap.data().nom;
              }
            }

            // garde seulement les bons d'achats non utilises
            const aEteUtilise = item.date_utilisation && item.date_utilisation !== "";
            if (aEteUtilise) {
              return null;
            }

            // calcul date expiration + 4 mois
            const dateAchat = item.date_achat;
            let dateExpiration = "Inconnue";

            if (dateAchat && dateAchat.includes('/')) {
              const parts = dateAchat.split('/');
              if (parts.length === 3) {
                const jour = parseInt(parts[0], 10);
                const mois = parseInt(parts[1], 10) - 1; 
                const annee = parseInt(parts[2], 10);

                // objet Date
                const dateObj = new Date(annee, mois, jour);
                
                // ajout de 4 mois
                dateObj.setMonth(dateObj.getMonth() + 4);

                // remise au format string
                const newDay = String(dateObj.getDate()).padStart(2, '0');
                const newMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
                const newYear = dateObj.getFullYear();

                dateExpiration = `${newDay}/${newMonth}/${newYear}`;
              }
            }

            const displayLines = [
              `Valeur : ${montantRecompense} €`,
              `Obtenu le : ${dateAchat}`,
              `Date d'expiration : ${dateExpiration}`,
            ];

            return {
              id: String(item.id_achat || Math.random()),
              title: nomMagasin, 
              color: '#BDE2EB', 
              date_achat: item.date_achat,
              lines: displayLines,
              codeBarre: `CODE-${item.id_achat}-1234`
            };
          }));

          const validItems = info.filter((item) => item !== null) as BonAchat[];
          setVouchers(validItems.reverse());
        }

      } catch (error) {
        console.error("Erreur récupération bons d'achat:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems:'center'}]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

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
        {vouchers.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>
            Aucun bon d'achat disponible.
          </Text>
        ) : (
          vouchers.map((item) => (
            <TransactionCard
              key={item.id}
              title={item.title} 
              color={item.color}
              lines={item.lines}
              onPress={() => setSelectedVoucher(item)} 
            />
          ))
        )}
      </ScrollView>

      {/* MODAL CODE BARRE */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedVoucher} 
        onRequestClose={() => setSelectedVoucher(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedVoucher(null)}>
          <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.bottomSheetLabel}>
              Code barre - {selectedVoucher?.title}
            </Text>
            
            <View style={styles.barcodeBox}>
              <Text style={styles.barcodeText}>
                {selectedVoucher?.codeBarre || "123456789"}
              </Text>
            </View>
            
            <Text style={{marginTop: 15, color: '#666', textAlign: 'center'}}>
              Valable jusqu'au : {selectedVoucher?.lines[2]?.split(': ')[1]}
            </Text>

            <Pressable 
              style={styles.closeButton} 
              onPress={() => setSelectedVoucher(null)}
            >
              <Text style={{color: 'white', fontWeight: 'bold'}}>Fermer</Text>
            </Pressable>

          </Pressable>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  bottomSheet: {
    backgroundColor: '#fff', 
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSheetLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  barcodeBox: {
    width: '100%',
    height: 100,
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderStyle: 'dashed' 
  },
  barcodeText: {
    fontSize: 24,
    letterSpacing: 3,
    fontWeight: 'bold'
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20
  }
});