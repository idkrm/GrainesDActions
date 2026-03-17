import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DefiCard, SearchBar } from "../components/SharedComponents";
import { database } from "../firebaseConfig";

interface Defi {
  id: string;
  categorie: number[];
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
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  useEffect(() => {
    const fetchCategoryNames = async () => {
      try {
        const snap = await getDocs(collection(database, "Categories"));
        const mapping: Record<number, string> = {};

        snap.forEach((docSnap) => {
          mapping[Number(docSnap.id)] = docSnap.data().nom;
        });

        setCategoryMap(mapping);
      } catch (e) {
        console.error("Erreur chargement catégories :", e);
      }
    };

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

    fetchCategoryNames();
    return () => unsub();
  }, []);

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories((prev) =>
        prev.includes(categoryId)
            ? prev.filter((c) => c !== categoryId)
            : [...prev, categoryId]
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
  };

  const activeFiltersCount = selectedCategories.length;

  const sortedCategories = useMemo(() => {
    return Object.entries(categoryMap)
        .map(([id, nom]) => ({
          id: Number(id),
          nom,
        }))
        .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [categoryMap]);

  const filteredDefis = useMemo(() => {
    return defis.filter((d) => {
      const nomMatch = (d.nom || "")
          .toLowerCase()
          .includes(searchText.toLowerCase().trim());

      const categoriesDefi = Array.isArray(d.categorie) ? d.categorie : [];

      const categoryMatch =
          selectedCategories.length === 0 ||
          selectedCategories.some((catId) => categoriesDefi.includes(catId));

      return nomMatch && categoryMatch;
    });
  }, [defis, searchText, selectedCategories]);

  return (
      <View style={styles.container}>
        <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Trouver une action..."
            onFilterPress={() => setFilterModalVisible(true)}
        />

        {activeFiltersCount > 0 && (
            <View style={styles.activeFiltersBanner}>
              <Ionicons name="options-outline" size={16} color="#2E7D32" />
              <Text style={styles.activeFiltersText}>
                {activeFiltersCount} catégorie
                {activeFiltersCount > 1 ? "s" : ""} sélectionnée
                {activeFiltersCount > 1 ? "s" : ""}
              </Text>

              <Pressable onPress={resetFilters}>
                <Text style={styles.resetInlineText}>Réinitialiser</Text>
              </Pressable>
            </View>
        )}

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
                renderItem={({ item }) => {
                  const itemAvecNoms = {
                    ...item,
                    categorie:
                        item.categorie?.map((id) => categoryMap[id] || "Défi") || [],
                  };

                  return (
                      <View style={styles.cardContainer}>
                        <DefiCard
                            item={itemAvecNoms}
                            cardWidth="100%"
                            onPress={() => {
                              router.push({
                                pathname: "/(routes)/challengeDescription",
                                params: { id: item.id },
                              });
                            }}
                        />
                      </View>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons
                        name="search-outline"
                        size={40}
                        color="#ccc"
                        style={{ marginBottom: 10 }}
                    />
                    <Text style={styles.emptyText}>
                      Aucun défi ne correspond à ta recherche.
                    </Text>
                  </View>
                }
            />
        )}

        <Modal
            visible={filterModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalWrapper}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filtrer les défis</Text>

                <Pressable onPress={() => setFilterModalVisible(false)}>
                  <Ionicons name="close" size={26} color="#333" />
                </Pressable>
              </View>

              <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
              >
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Catégories</Text>
                  <View style={styles.chipsContainer}>
                    {sortedCategories.map((category) => {
                      const isSelected = selectedCategories.includes(category.id);

                      return (
                          <Pressable
                              key={category.id}
                              style={[
                                styles.chip,
                                isSelected && styles.chipSelected,
                              ]}
                              onPress={() => toggleCategory(category.id)}
                          >
                            <Text
                                style={[
                                  styles.chipText,
                                  isSelected && styles.chipTextSelected,
                                ]}
                            >
                              {category.nom}
                            </Text>
                          </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable style={styles.resetButton} onPress={resetFilters}>
                  <Text style={styles.resetButtonText}>Réinitialiser</Text>
                </Pressable>

                <Pressable
                    style={styles.applyButton}
                    onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={styles.applyButtonText}>Voir les résultats</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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

  activeFiltersBanner: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E8F5E9",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  activeFiltersText: {
    color: "#2E7D32",
    fontWeight: "700",
    fontSize: 13,
  },
  resetInlineText: {
    color: "#1B5E20",
    fontWeight: "800",
    fontSize: 13,
    marginLeft: 4,
  },

  modalWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "80%",
    paddingTop: 18,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1A1A1A",
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 14,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  chipSelected: {
    backgroundColor: "#65B369",
    borderColor: "#65B369",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#555",
  },
  chipTextSelected: {
    color: "#fff",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#fff",
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#F3F3F3",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButtonText: {
    color: "#666",
    fontWeight: "800",
    fontSize: 15,
  },
  applyButton: {
    flex: 1.4,
    backgroundColor: "#65B369",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});