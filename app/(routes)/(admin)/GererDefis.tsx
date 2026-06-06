import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { db } from "../../firebaseConfig";

interface Defi {
  id: string;
  nom: string;
  description: string;
  pourquoi?: string;
  categorie: string[]; // <-- Contient désormais les IDs des catégories
  co2: number;
  difficulte: number;
  image: string;
  validation: boolean;
}

// Nouvelle interface pour ta collection Categories
interface CategorieDB {
  id: string;
  nom: string;
}

export default function GestionDefisScreen() {
  const router = useRouter();

  const [defis, setDefis] = useState<Defi[]>([]);
  const [categoriesDB, setCategoriesDB] = useState<CategorieDB[]>([]); // <-- Stocke les catégories de Firebase

  const [chargement, setChargement] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [pourquoi, setPourquoi] = useState("");
  const [co2, setCo2] = useState("");
  const [difficulte, setDifficulte] = useState("");
  const [image, setImage] = useState("");
  const [validation, setValidation] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // --- CHARGEMENT DES DONNÉES (DÉFIS + CATÉGORIES) ---
  useEffect(() => {
    const unsubDefis = onSnapshot(
      collection(db, "Defis"),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Defi, "id">),
        }));
        setDefis(data as Defi[]);
        setChargement(false);
      },
      (error) => {
        // console.error("Erreur lecture défis :", error);
        setChargement(false);
      }
    );

    const unsubCats = onSnapshot(
      collection(db, "Categories"), 
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          nom: d.data().nom || "Sans nom",
        }));
        setCategoriesDB(data);
      },
      (error) => {
        // console.error("Erreur lecture catégories :", error);
      }
    );

    return () => {
      unsubDefis();
      unsubCats();
    };
  }, []);

  const filteredDefis = defis.filter((d) =>
    (d.nom || "").toLowerCase().includes(searchText.toLowerCase())
  );

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const currentList = Array.isArray(prev) ? prev : [];

      if (currentList.includes(categoryId)) {
        return currentList.filter(id => id !== categoryId);
      } else {
        return [...currentList, categoryId];
      }
    });
  };

  const handleAdd = () => {
    setEditingId(null);
    setNom("");
    setDescription("");
    setPourquoi("");
    setSelectedCategories([]);
    setCo2("");
    setDifficulte("");
    setImage("");
    setValidation(false);
    setModalVisible(true);
  };

  const handleEdit = (defi: Defi) => {
    setEditingId(defi.id);
    setNom(defi.nom || "");
    setDescription(defi.description || "");
    setPourquoi(defi.pourquoi || "");
    setSelectedCategories(Array.isArray(defi.categorie) ? defi.categorie : []);
    setCo2(defi.co2?.toString() || "");
    setDifficulte(defi.difficulte?.toString() || "");
    setImage(defi.image || "");
    setValidation(defi.validation || false);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!nom.trim()) {
      Alert.alert("Erreur", "Le nom du défi est obligatoire.");
      return;
    }

    if (selectedCategories.length === 0) {
      Alert.alert("Erreur", "Veuillez sélectionner au moins une catégorie.");
      return;
    }

    const dataToSave = {
      nom,
      description,
      pourquoi,
      categorie: selectedCategories,
      co2: Number.parseInt(co2) || 0,
      difficulte: Number.parseInt(difficulte) || 1,
      image,
      validation,
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "Defis", editingId), dataToSave);
      } else {
        await addDoc(collection(db, "Defis"), dataToSave);
      }
      setModalVisible(false);
    } catch (error) {
      // console.error("Erreur sauvegarde :", error);
      Alert.alert("Erreur", "Impossible de sauvegarder le défi.");
    }
  };

  // --- SUPPRIMER ---
  const handleDelete = (id: string, nom: string) => {
    Alert.alert(
      "Supprimer le défi",
      `Êtes-vous sûr de vouloir supprimer "${nom}" ? Cette action est irréversible.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "Defis", id));
            } catch (error) {
              // console.error("Erreur suppression :", error);
            }
          }
        }
      ]
    );
  };

  // --- RENDU D'UNE LIGNE DE DÉFI ---
  const renderItem = ({ item }: { item: Defi }) => {
    const categoryNames = Array.isArray(item.categorie)
      ? item.categorie.map(id => categoriesDB.find(c => c.id === id)?.nom).filter(Boolean).join(", ")
      : "Général";

    return (
      <View style={styles.listItem}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle} numberOfLines={2}>{item.nom}</Text>
          <Text style={styles.itemSubtitle} numberOfLines={1}>
            {categoryNames || "Général"}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.5 }]}
            onPress={() => handleEdit(item)}
          >
            <View style={[styles.actionCircle, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="create-outline" size={20} color="#1976D2" />
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.5 }]}
            onPress={() => handleDelete(item.id, item.nom)}
          >
            <View style={[styles.actionCircle, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="trash-outline" size={20} color="#E53935" />
            </View>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.headerTitle}>Gestion des défis</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Rechercher un défi..."
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#888"
          />
        </View>
      </View>

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
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun défi trouvé.</Text>}
        />
      )}

      <Pressable style={styles.fab} onPress={handleAdd}>
        <Ionicons name="add" size={32} color="white" />
      </Pressable>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? "Modifier le défi" : "Ajouter un défi"}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeModalBtn}>
                <Ionicons name="close" size={22} color="#555" />
              </Pressable>
            </View>

            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>

              <Text style={styles.label}>Nom du défi *</Text>
              <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Ex: Ramasser des déchets" />
              <Text style={styles.label}>Catégories *</Text>
              {categoriesDB.length === 0 ? (
                <Text style={styles.errorHint}>Chargement des catégories...</Text>
              ) : (
                <View style={styles.categoriesContainer}>
                  {categoriesDB.map((cat) => {
                    const isSelected = Array.isArray(selectedCategories) && selectedCategories.includes(cat.id);
                    return (
                      <Pressable
                        key={cat.id}
                        style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                        onPress={() => toggleCategory(cat.id)}
                      >
                        <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                          {cat.nom}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
              {(!selectedCategories || selectedCategories.length === 0) && (
                <Text style={styles.errorHint}>Veuillez sélectionner au moins une catégorie</Text>
              )}

              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Brève description..." multiline />

              <Text style={styles.label}>Pourquoi est-ce important ?</Text>
              <TextInput style={[styles.input, styles.textArea]} value={pourquoi} onChangeText={setPourquoi} placeholder="Expliquez l'impact écologique..." multiline />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.label}>Points CO2</Text>
                  <TextInput style={styles.input} value={co2} onChangeText={setCo2} placeholder="Ex: 10" keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Difficulté (1 à 5)</Text>
                  <TextInput style={styles.input} value={difficulte} onChangeText={setDifficulte} placeholder="Ex: 2" keyboardType="numeric" />
                </View>
              </View>

              <Text style={styles.label}>URL de l'image</Text>
              <TextInput style={styles.input} value={image} onChangeText={setImage} placeholder="https://..." autoCapitalize="none" />

              <View style={styles.switchRow}>
                <Text style={styles.labelSwitch}>Nécessite une validation photo ?</Text>
                <Switch
                  value={validation}
                  onValueChange={setValidation}
                  trackColor={{ false: "#E0E0E0", true: "#65B369" }}
                />
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={[styles.button, styles.buttonCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonCancelText}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.buttonSave]} onPress={handleSave}>
                <Text style={styles.buttonSaveText}>Enregistrer</Text>
              </Pressable>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA", paddingTop: 50 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1A1A1A',
    paddingBottom: 15 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 15, height: 50, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  itemSubtitle: { fontSize: 13, color: '#888', fontWeight: '500' },
  actionButtons: { flexDirection: 'row', gap: 10 },
  iconButton: { padding: 4 },
  actionCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 30, textAlign: "center", color: "#888", fontStyle: 'italic' },
  fab: { position: 'absolute', bottom: 30, right: 25, backgroundColor: '#65B369', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowColor: "#65B369", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#FAFAFA', height: '92%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  closeModalBtn: { backgroundColor: '#E0E0E0', borderRadius: 16, padding: 6 },
  formScroll: { flex: 1 },
  label: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8, marginTop: 15, marginLeft: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EFEFEF', borderRadius: 16, padding: 14, fontSize: 15, color: '#333' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, backgroundColor: '#fff', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#EFEFEF' },
  labelSwitch: { fontSize: 15, fontWeight: '600', color: '#333' },
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5 },
  categoryChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  categoryChipSelected: { backgroundColor: '#E8F5E9', borderColor: '#65B369' },
  categoryText: { fontSize: 14, color: '#666', fontWeight: '600' },
  categoryTextSelected: { color: '#2E7D32' },
  errorHint: { color: '#E53935', fontSize: 12, marginTop: 6, marginLeft: 4 },
  modalFooter: { flexDirection: 'row', gap: 15, paddingTop: 15, backgroundColor: '#FAFAFA' },
  button: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  buttonCancel: { backgroundColor: '#E0E0E0' },
  buttonCancelText: { color: '#555', fontWeight: '800', fontSize: 16 },
  buttonSave: { backgroundColor: '#65B369', shadowColor: "#65B369", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
  buttonSaveText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});