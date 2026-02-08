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

// IMPORTS FIREBASE
import { doc, getDoc } from 'firebase/firestore';
import { auth, database } from "../../firebaseConfig";

type HistoryItem = {
  id: string; // id_achat
  title: string;
  color: string;
  lines: string[];
  date_achat: string; // pour le tri
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

        // recup du document de l'utilisation
        const userDocRef = doc(database, "Users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          // recup tableau recompense
          const rawRewards = userData.recompense || [];

          // recup info des recompenses (nom, magasion/asso, description, points)
          const info = await Promise.all(rawRewards.map(async (item: any) => {
            let nomRecompense = "Récompense";
            let descriptionRecompense = "";
            let points = "";
            let isActionEcologique = false; 

            if (item.id_recompense) {
              const recRef = doc(database, "Recompenses", String(item.id_recompense));
              const recSnap = await getDoc(recRef);
              if (recSnap.exists()) {
                const recData = recSnap.data();
                nomRecompense = recData.nom;
                descriptionRecompense = recData.description;
                points = recData.nb_points;

                // si don ou plantation
                const lowerName = nomRecompense.toLowerCase();
                if (lowerName.includes('don') || lowerName.includes('arbre') || lowerName.includes('plantation')) {
                  isActionEcologique = true;
                }
              }
            }

            // nom asso ou magasin
            let nom = "Inconnu";

            if (isActionEcologique) {
              // cas don : nom de l'asso
              if (item.id_asso) {
                const assoRef = doc(database, "Assos", String(item.id_asso));
                const assoSnap = await getDoc(assoRef);
                if (assoSnap.exists()) {
                  nom = assoSnap.data().nom;
                } else {
                    nom = "Association inconnue";
                }
              }
            } else {
              // cas bon d'achat : nom du magasin
              if (item.id_magasin) {
                const magRef = doc(database, "Magasins", String(item.id_magasin));
                const magSnap = await getDoc(magRef);
                if (magSnap.exists()) {
                  nom = magSnap.data().nom;
                } else {
                    nom = "Magasin inconnu";
                }
              }
            }

            // si bon d'achat non utilise
            const aEteUtilise = item.date_utilisation && item.date_utilisation !== "";
            
            if (!isActionEcologique && !aEteUtilise) {
              return null; // retourne null pour l'item actuel
            }

            const displayLines = [
              `Détail : ${descriptionRecompense}`,
              isActionEcologique ? `Association : ${nom}` : `Magasin : ${nom}`,
              `Obtenu le : ${item.date_achat}`,
              points ? `Coût : ${points} points` : null
            ];

            if (aEteUtilise) {
              displayLines.push(`Utilisé le : ${item.date_utilisation}`);
            }

            if(isActionEcologique) {
              displayLines.push(`Montant : ${item.montant} €`);
            }

            return {
              id: String(item.id_achat),
              title: nomRecompense, 
              color: isActionEcologique ? '#65B369' : '#BDE2EB', 
              date_achat: item.date_achat,
              lines: displayLines.filter(Boolean) as string[]
            };
          }));
          const validItems = info.filter((item) => item !== null) as HistoryItem[];
          setHistoryItems(validItems.reverse()); // pour voir les derniers ajouts en haut
        }

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
      <View style={[styles.container, {justifyContent: 'center', alignItems:'center'}]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </Pressable>
        <Text style={styles.headerTitle}>Historique</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {historyItems.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>
            Aucun historique disponible.
          </Text>
        ) : (
          historyItems.map((item, index) => (
            <TransactionCard
              key={index}
              title={item.title}
              color={item.color}
              lines={item.lines}
            />
          ))
        )}
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