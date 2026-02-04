import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Dimensions, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { database } from "../firebaseConfig";

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
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
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

  const filteredDefis = defis.filter((d) =>
    d.nom.toLowerCase().includes(searchText.toLowerCase())
  );

  if (chargement) {
    return (
      <View style={styles.center}>
        <Text>Chargement des défis...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* HEADER : BARRE DE RECHERCHE + FILTRE */}
      <View style={styles.searchHeader}>
        {/* Barre de recherche */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Rechercher un défi..."
            style={styles.input}
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#888"
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={18} color="#888" />
            </Pressable>
          )}
        </View>

        {/* Bouton Filtre */}
        <Pressable 
          style={styles.filterButton} 
          onPress={() => console.log("Ouvrir le modal de filtres")}
        >
          <Ionicons name="filter" size={24} color="#333" />
        </Pressable>
      </View>

      {/* LISTE DES DÉFIS */}
      <FlatList
        data={filteredDefis}
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
          <Text style={styles.empty}>Aucun défi ne correspond à votre recherche.</Text>
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
    paddingTop: 10,
    backgroundColor: "#fff",
  },
  
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    gap: 10, 
  },
  searchBar: {
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 45,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  filterButton: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
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