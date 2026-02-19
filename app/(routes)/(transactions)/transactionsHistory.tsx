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
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { auth, database } from "../../firebaseConfig";

type HistoryItem = {
  id: string; // id_achat
  title: string;
  color: string;
  lines: string[];
  date_achat: string; // pour le tri
};

const formaterDate = (timestamp: any) => {
  if (timestamp.toDate) {
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
          collection(database, "RecompenseUser"),
          where("id_user", "==", user.uid)
        );

        const snapshot = await getDocs(qRecompensesUser);

        // si aucun user
        if (snapshot.empty) {
          setHistoryItems([]);
          setLoading(false);
          return;
        }

        // recompense user
        const recompense = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // details recompenses (nom, asso/magasin, montant, detail, points)
        const info = await Promise.all(recompense.map(async (item: any) => {
          let nomRecompense = "Récompense";
          let descriptionRecompense = "";
          let points = "";
          let isDon = false; 
          let isArbre = false;

          if (item.id_recompense) {
            const recRef = doc(database, "Recompenses", String(item.id_recompense));
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
            // cas don : nom de l'asso
            if (item.id_asso) {
              const assoRef = doc(database, "Assos", String(item.id_asso));
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
            // Cas bon d'achat : nom du magasin
            if (item.id_magasin) {
              const magRef = doc(database, "Magasins", String(item.id_magasin));
              const magSnap = await getDoc(magRef);
              nom = magSnap.exists() ? magSnap.data().nom : "Magasin inconnu";
            } else {
              nom = item.nom_recompense || "Récompense";
            }
          }

          // si bon d'achat non utilise
          const aEteUtilise = item.date_utilisation && item.date_utilisation !== "";
          
          if (!isDon && !aEteUtilise && !isArbre) {
            return null;
          }

          const displayLines = [
            points ? `Coût : ${points} points` : null,
            `Détail : ${descriptionRecompense}`,
            `Obtenu le : ${formaterDate(item.date_achat)}`
          ];

          if (aEteUtilise) {
            displayLines.push(`Utilisé le : ${formaterDate(item.date_utilisation)}`);
          }

          // montant si don
          if(isDon && item.montant) {
            displayLines.push(`Montant : ${item.montant} €`);
          }

          return {
            id: item.id,
            title: nom, 
            color: isDon ? '#65B369' : '#BDE2EB', 
            date_achat: item.date_achat,
            lines: displayLines.filter(Boolean) as string[]
          };
        }));

        const validItems = info.filter((item) => item !== null) as HistoryItem[];
        
        setHistoryItems(validItems.reverse()); // pour voir les derniers ajouts en haut

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
              key={item.id}
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