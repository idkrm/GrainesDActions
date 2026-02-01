import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { database } from "../firebaseConfig"; // adapte si ton export = db

interface Recompense {
  id: string;
  nom: string;
  description: string;
  nb_points: number;
  image?: string; 
}

const NUM_COLUMNS = 2;
const GAP = 12;
const SCREEN_PADDING = 16;

export default function RewardsScreen() {
  const router = useRouter();

  const [recompenses, setRecompenses] = useState<Recompense[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
        collection(database, "Recompenses"),
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Recompense, "id">),
          }));

          setRecompenses(data as Recompense[]);
          setChargement(false);
        },
        (error) => {
          console.error("Erreur lecture récompenses :", error);
          setChargement(false);
        }
    );

    return () => unsub();
  }, []);

  if (chargement) {
    return (
        <View style={styles.center}>
          <Text>Chargement des récompenses...</Text>
        </View>
    );
  }

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Boutique</Text>

        <FlatList
            data={recompenses}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
                <Pressable
                    style={styles.card}
                    onPress={() => {
                      // Redirection vers une page de détail
                      console.log("Achat récompense :", item.nom);
                      router.push({
                        pathname: "/(routes)/recompenseDescription",
                        params: { id: item.id },
                       });
                    }}
                >
                  {/* Titre de la récompense */}
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.nom}
                  </Text>

                  {/* Affichage des points */}
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>{item.nb_points} pts</Text>
                  </View>
                </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>Aucune récompense disponible.</Text>
            }
        />
      </View>
  );
}

const { width } = Dimensions.get("window");
const cardSize = (width - SCREEN_PADDING * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    color: "#2C3E50",
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  card: {
    width: cardSize,
    height: cardSize,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    backgroundColor: "#FAFAFA",
    padding: 12,
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
    marginTop: 10,
  },
  pointsBadge: {
    backgroundColor: "#E8F5E9",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginBottom: 5,
  },
  pointsText: {
    color: "#2E7D32",
    fontWeight: "bold",
    fontSize: 12,
  },
  empty: {
    marginTop: 20,
    textAlign: "center",
    color: "#666",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});