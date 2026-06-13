import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import TransactionCard from '../../components/profile/transactionCard';

import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from "../../firebaseConfig";

type HistoryItem = {
  id: string; // id_achat
  title: string;
  color: string;
  lines: string[];
  date_achat: string; // pour le tri
};

const formaterDate = (timestamp: any) => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate().toLocaleDateString("fr-FR");
  }
  return "Date inconnue";
};

export default function TransactionsScreen() {
  const router = useRouter();
  
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // recuperation des docs correspondant à l'utilisateur connecte
        const qRecompensesUser = query(
          collection(db, "RecompenseUser"),
          where("id_user", "==", user.uid)
        );

        const snapshot = await getDocs(qRecompensesUser);

        // si aucun echange
        if (snapshot.empty) {
          setHistoryItems([]);
          setLoading(false);
          return;
        }

        const recompense = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // details recompenses
        const info = await Promise.all(recompense.map(async (item: any) => {
          let nomRecompense = "Récompense";
          let descriptionRecompense = "";
          let points = "";
          let isDon = false; 
          let isArbre = false;

          if (item.id_recompense) {
            const recRef = doc(db, "Recompenses", String(item.id_recompense));
            const recSnap = await getDoc(recRef);
            if (recSnap.exists()) {
              const recData = recSnap.data();
              nomRecompense = recData.nom;
              descriptionRecompense = recData.description;
              points = recData.nb_points;

              const lowerName = nomRecompense.toLowerCase();
              if (lowerName.includes('don')) {
                isDon = true;
              }

              if (lowerName.includes('arbre')) {
                isArbre = true;
              }
            }
          }

          // nom asso/magasin/arbre
          let nom = "Inconnu";

          if (isDon) {
            if (item.id_asso) {
              const assoRef = doc(db, "Assos", String(item.id_asso));
              const assoSnap = await getDoc(assoRef);
              nom = assoSnap.exists() ? assoSnap.data().nom : "Association inconnue";
            } else {
               nom = item.nom_recompense || "Don écologique";
            }
          } 
          else if (isArbre) {
            nom = "Plantation d'un arbre";
          } 
          else {
            if (item.id_magasin) {
              const magRef = doc(db, "Magasins", String(item.id_magasin));
              const magSnap = await getDoc(magRef);
              nom = magSnap.exists() ? magSnap.data().nom : "Magasin inconnu";
            } else {
              nom = item.nom_recompense || "Récompense";
            }
          }

          const aEteUtilise = item.date_utilisation && item.date_utilisation !== "";
          
          // On n'affiche pas les bons d'achat NON utilisés (ils sont dans l'autre page)
          if (!isDon && !aEteUtilise && !isArbre) {
            return null;
          }

          const displayLines = [
            points ? `Coût : ${points} points` : null,
            descriptionRecompense ? `Détail : ${descriptionRecompense}` : null,
            `Obtenu le : ${formaterDate(item.date_achat)}`
          ];

          if (aEteUtilise) {
            displayLines.push(`Utilisé le : ${formaterDate(item.date_utilisation)}`);
          }

          if (isDon && item.montant) {
            displayLines.push(`Montant : ${item.montant} €`);
          }

          return {
            id: item.id,
            title: nom, 
            color: isDon || isArbre ? '#E8F5E9' : '#F5F5F5',
            date_achat: item.date_achat,
            lines: displayLines.filter(Boolean) as string[]
          };
        }));

        const validItems = info.filter((item) => item !== null) as HistoryItem[];
        
        // VRAI TRI CHRONOLOGIQUE DÉCROISSANT
        validItems.sort((a, b) => {
            const dateA = a.date_achat ? (a.date_achat as any).toMillis() : 0;
            const dateB = b.date_achat ? (b.date_achat as any).toMillis() : 0;
            return dateB - dateA;
        });

        setHistoryItems(validItems); 

      } catch (error) {
        console.error("Erreur récupération historique:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <View style={[styles.mainContainer, styles.center]}>
        <ActivityIndicator size="large" color="#65B369" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      
      <View style={styles.headerTop}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={15}>
          <Ionicons name="arrow-back" size={28} color="#1A1A1A" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerTitles}>
          <Text style={styles.title}>Historique</Text>
          <Text style={styles.subtitle}>Retrouve toutes tes bonnes actions</Text>
        </View>

        {historyItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={50} color="#ccc" style={{ marginBottom: 15 }} />
            <Text style={styles.emptyText}>Aucun historique disponible.</Text>
            <Text style={styles.emptySubText}>
              Tes futurs dons, arbres plantés et bons d'achats utilisés apparaîtront ici !
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {historyItems.map((item) => (
              <View key={item.id} style={styles.cardWrapper}>
                <TransactionCard
                  title={item.title}
                  color={item.color}
                  lines={item.lines}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

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

  listContainer: {
    gap: 15,
  },
  cardWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    backgroundColor: 'transparent',
  },

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
});