import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { DefiCard, SearchBar } from "../components/SharedComponents";

import { database } from "../firebaseConfig";

interface Defi {
  id: string;
  categorie?: unknown;
  co2: number;
  nom: string;
  description: string;
  validation: boolean;
  difficulte?: number;
  image?: string;
}

const SCREEN_PADDING = 20;

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
        console.error("Erreur lecture BD :", error);
        setChargement(false);
      }
    );
    return () => unsub();
  }, []);

  const filteredDefis = defis.filter((d) =>
    (d.nom || "").toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>

      <SearchBar 
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Trouver une action..."
        onFilterPress={() => console.log("Ouvrir filtres")}
      />

      {/* LISTE */}
      {chargement ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#65B369" />
        </View>
      ) : (
        <FlatList
          data={filteredDefis}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            
            <View style={styles.cardContainer}>
              <DefiCard 
                item={item} 
                cardWidth="100%" 
                onPress={() => {
                  router.push({
                    pathname: "/(routes)/challengeDescription",
                    params: { id: item.id },
                  });
                }} 
              />
            </View>
            
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={40} color="#ccc" style={{ marginBottom: 10 }}/>
              <Text style={styles.emptyText}>Aucun défi ne correspond à ta recherche.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING,
    backgroundColor: "#FAFAFA",
    paddingBottom: 100,
  },
  header: {
    marginBottom: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 40,
    paddingTop: 5,
  },
  cardContainer: {
    marginBottom: 15,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    fontSize: 15,
  },
});