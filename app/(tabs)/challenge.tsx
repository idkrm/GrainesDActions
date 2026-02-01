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

interface Defi {
  id: string;
  categorie: string[];
  co2: number;
  nom: string;
  description: string;
  validation: boolean;
  difficulte?: number;
  image?: string;
}

const NUM_COLUMNS = 2;
const GAP = 12;
const SCREEN_PADDING = 16;

export default function ChallengeScreen() {
  const router = useRouter();

  const [defis, setDefis] = useState<Defi[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    // ✅ Important : collection = "Defis" (sans accent) comme dans ta capture
    const unsub = onSnapshot(
        collection(database, "Defis"),
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Defi, "id">),
          }));

          setDefis(data as Defi[]);
          setChargement(false);
        },
        (error) => {
          console.error("Ne peut pas lire dans la base de données :", error);
          setChargement(false);
        }
    );

    return () => unsub();
  }, []);

  if (chargement) {
    return (
        <View style={styles.center}>
          <Text>Chargement des défis...</Text>
        </View>
    );
  }

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Challenges</Text>

        <FlatList
            data={defis}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
                <Pressable
                    style={styles.card}
                    onPress={() => {
                      console.log("CLICK DEFIS ID =", item.id);
                      router.push({
                        pathname: "/(routes)/challengeDescription",
                        params: { id: item.id },
                      });
                    }}
                >
                  <Text style={styles.cardTitle} numberOfLines={3}>
                    {item.nom}
                  </Text>
                </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>Aucun défi trouvé.</Text>
            }
        />
      </View>
  );
}

const { width } = Dimensions.get("window");
const cardSize =
    (width - SCREEN_PADDING * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

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
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    color: "#111",
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
