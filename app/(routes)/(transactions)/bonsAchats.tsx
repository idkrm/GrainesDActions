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
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { auth, database } from "../../firebaseConfig";

type BonAchat = {
  id: string; 
  title: string;
  color: string;
  lines: string[];
  date_achat: string;
  codeBarre?: string;
  magasinImage?: string; // Nouvelle info si on veut afficher l'icône du magasin plus tard
};

const formaterDate = (timestamp: any) => {
  if (timestamp.toDate) {
    return timestamp.toDate().toLocaleDateString("fr-FR");
  }
  return "Date inconnue";
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

        const qRecompensesUser = query(
          collection(database, "RecompenseUser"),
          where("id_user", "==", user.uid)
        );

        const snapshot = await getDocs(qRecompensesUser);

        if (snapshot.empty) {
          setVouchers([]);
          setLoading(false);
          return;
        }

        const rawRewards = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const info = await Promise.all(rawRewards.map(async (item: any) => {
          
          let nomRecompense = "Récompense";
          let montantRecompense; 

          if (item.id_recompense) {
            const recRef = doc(database, "Recompenses", String(item.id_recompense));
            const recSnap = await getDoc(recRef);
            if (recSnap.exists()) {
              const recData = recSnap.data();
              nomRecompense = recData.nom;
              montantRecompense = item.montant || recData.montant || "0"; 
            }
          }

          const lowerName = nomRecompense.toLowerCase();
          if (lowerName.includes('don') || lowerName.includes('arbre') || item.id_asso) {
            return null;
          }

          const aEteUtilise = item.date_utilisation && item.date_utilisation !== "";
          if (aEteUtilise) {
            return null;
          }

          let nomMagasin = "Magasin";
          if (item.id_magasin) {
            const magRef = doc(database, "Magasins", String(item.id_magasin));
            const magSnap = await getDoc(magRef);
            if (magSnap.exists()) {
              nomMagasin = magSnap.data().nom;
            }
          }

          const dateAchat = formaterDate(item.date_achat);
          let dateExpiration = "Inconnue";

          if (dateAchat && dateAchat.includes('/')) {
            const parts = dateAchat.split('/');
            if (parts.length === 3) {
              const jour = parseInt(parts[0], 10);
              const mois = parseInt(parts[1], 10) - 1; 
              const annee = parseInt(parts[2], 10);

              const dateObj = new Date(annee, mois, jour);
              dateObj.setMonth(dateObj.getMonth() + 4);

              const newDay = String(dateObj.getDate()).padStart(2, '0');
              const newMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
              const newYear = dateObj.getFullYear();

              dateExpiration = `${newDay}/${newMonth}/${newYear}`;
            }
          }

          const displayLines = [
            `Valeur : ${montantRecompense} €`,
            `Obtenu le : ${dateAchat}`,
            `Expire le : ${dateExpiration}`,
          ];

          return {
            id: item.id,
            title: `Bon d'achat ${nomMagasin}`, 
            color: '#E0F7FA', // Bleu très clair (Soft UI)
            date_achat: item.date_achat,
            lines: displayLines,
            codeBarre: `${item.id.substring(0, 8).toUpperCase()}`
          };
        }));

        const validItems = info.filter((item) => item !== null) as BonAchat[];
        
        // Tri par date décroissante
        validItems.sort((a, b) => {
          const dateA = a.date_achat ? (a.date_achat as any).toMillis() : 0;
          const dateB = b.date_achat ? (b.date_achat as any).toMillis() : 0;
          return dateB - dateA;
        });

        setVouchers(validItems);

      } catch (error) {
        console.error("Erreur récupération bons d'achat:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, []);

  // --- RENDU EN COURS DE CHARGEMENT ---
  if (loading) {
    return (
      <View style={[styles.mainContainer, styles.center]}>
        <ActivityIndicator size="large" color="#65B369" />
      </View>
    );
  }

  // --- RENDU FINAL ---
  return (
    <View style={styles.mainContainer}>
      
      {/* HEADER TOP (Bouton retour) */}
      <View style={styles.headerTop}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={15}>
          <Ionicons name="arrow-back" size={28} color="#1A1A1A" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* TITRES */}
        <View style={styles.headerTitles}>
          <Text style={styles.title}>Mes bons d'achats</Text>
          <Text style={styles.subtitle}>Utilise tes récompenses en magasin</Text>
        </View>

        {/* LISTE DES BONS */}
        {vouchers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={50} color="#ccc" style={{ marginBottom: 15 }} />
            <Text style={styles.emptyText}>Aucun bon d'achat disponible.</Text>
            <Text style={styles.emptySubText}>
              Échange tes points dans la boutique pour obtenir des bons d'achat !
            </Text>
          </View>
        ) : (
          <View style={styles.vouchersList}>
            {vouchers.map((item) => (
              <View key={item.id} style={styles.cardWrapper}>
                <TransactionCard
                  title={item.title} 
                  color={item.color}
                  lines={item.lines}
                  onPress={() => setSelectedVoucher(item)} 
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODAL CODE BARRE */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!selectedVoucher} 
        onRequestClose={() => setSelectedVoucher(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedVoucher(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            
            <Pressable style={styles.closeButton} onPress={() => setSelectedVoucher(null)}>
                <Ionicons name="close" size={24} color="#333" />
            </Pressable>

            <View style={styles.modalIconContainer}>
               <Ionicons name="barcode-outline" size={40} color="#65B369" />
            </View>

            <Text style={styles.modalTitle}>
              {selectedVoucher?.title}
            </Text>

            <Text style={styles.modalInstruction}>
              Présente ce code à la caisse pour bénéficier de ta réduction.
            </Text>
            
            <View style={styles.barcodeBox}>
              {/* Simulation visuelle de code barre (barres verticales) */}
              <View style={styles.barcodeLinesContainer}>
                 {[...Array(15)].map((_, i) => (
                   <View key={i} style={[
                     styles.barcodeLine, 
                     { width: Math.random() > 0.5 ? 2 : 5, opacity: Math.random() > 0.2 ? 1 : 0.5 }
                   ]} />
                 ))}
              </View>
              <Text style={styles.barcodeText}>
                {selectedVoucher?.codeBarre}
              </Text>
            </View>
            
            <View style={styles.modalFooterRow}>
               <Ionicons name="calendar-outline" size={16} color="#666" />
               <Text style={styles.modalExpiration}>
                 {selectedVoucher?.lines[2]}
               </Text>
            </View>

          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA', 
    paddingTop: 50,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // --- HEADER ---
  headerTop: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 5,
    marginLeft: -5,
  },
  headerTitles: {
    marginBottom: 35,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },

  // --- LISTE BONS ---
  vouchersList: {
    gap: 15, // Espacement entre les cartes
  },
  cardWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    backgroundColor: 'transparent',
  },

  // --- EMPTY STATE ---
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },

  // --- MODAL CODE BARRE ---
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff', 
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalInstruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  barcodeBox: {
    width: '100%',
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: 25,
  },
  barcodeLinesContainer: {
    flexDirection: 'row',
    height: 60,
    width: '80%',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  barcodeLine: {
    backgroundColor: '#000',
    height: '100%',
  },
  barcodeText: {
    fontSize: 22,
    letterSpacing: 4,
    fontWeight: '900',
    color: '#000',
  },
  modalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  modalExpiration: {
    marginLeft: 6,
    color: '#555',
    fontWeight: '600',
    fontSize: 13,
  }
});