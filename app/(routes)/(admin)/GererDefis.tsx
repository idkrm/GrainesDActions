import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { database } from "../../firebaseConfig";

interface Defi {
  id: string;
  nom: string;
  description: string;
  pourquoi?: string;
  categorie: string[];
  co2: number;
  difficulte: number;
  image: string;
  validation: boolean;
}

export default function GestionDefisScreen() {
  const router = useRouter();

  const [defis, setDefis] = useState<Defi[]>([]);
  const [chargement, setChargement] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [pourquoi, setPourquoi] = useState("");
  const [categorie, setCategorie] = useState("");
  const [co2, setCo2] = useState("");
  const [difficulte, setDifficulte] = useState("");
  const [image, setImage] = useState("");
  const [validation, setValidation] = useState(false);

  // --- CHARGEMENT DES DONNÉES ---
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
        console.error("Erreur lecture défis :", error);
        setChargement(false);
      }
    );
    return () => unsub();
  }, []);

  const filteredDefis = defis.filter((d) =>
    (d.nom || "").toLowerCase().includes(searchText.toLowerCase())
  );

  // --- OUVRIR LE FORMULAIRE ---
  const handleAdd = () => {
    setEditingId(null);
    setNom("");
    setDescription("");
    setPourquoi("");
    setCategorie("");
    setCo2("");
    setDifficulte("");
    setImage("");
    setValidation(false);
    setModalVisible(true);
  };

  // --- OUVRIR LE FORMULAIRE ---
  const handleEdit = (defi: Defi) => {
    setEditingId(defi.id);
    setNom(defi.nom || "");
    setDescription(defi.description || "");
    setPourquoi(defi.pourquoi || "");
    setCategorie(defi.categorie?.join(", ") || ""); // Transforme le tableau en string
    setCo2(defi.co2?.toString() || "");
    setDifficulte(defi.difficulte?.toString() || "");
    setImage(defi.image || "");
    setValidation(defi.validation || false);
    setModalVisible(true);
  };

  // --- SAUVEGARDER (AJOUT OU MODIFICATION) ---
  const handleSave = async () => {
    if (!nom.trim()) {
      Alert.alert("Erreur", "Le nom du défi est obligatoire.");
      return;
    }

    // Préparation des données formatées
    const dataToSave = {
      nom,
      description,
      pourquoi,
      categorie: categorie.split(",").map((c) => c.trim()).filter((c) => c !== ""), // Transforme en tableau
      co2: parseInt(co2) || 0, // Convertit en nombre
      difficulte: parseInt(difficulte) || 1,
      image,
      validation,
    };

    try {
      if (editingId) {
        // Mode Modification
        await updateDoc(doc(database, "Defis", editingId), dataToSave);
        console.log("Défi mis à jour");
      } else {
        // Mode Ajout
        await addDoc(collection(database, "Defis"), dataToSave);
        console.log("Défi ajouté");
      }
      setModalVisible(false);
    } catch (error) {
      console.error("Erreur sauvegarde :", error);
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
              await deleteDoc(doc(database, "Defis", id));
            } catch (error) {
              console.error("Erreur suppression :", error);
            }
          }
        }
      ]
    );
  };

  // --- RENDU D'UNE LIGNE DE DÉFI ---
  const renderItem = ({ item }: { item: Defi }) => (
    <View style={styles.listItem}>
      <Text style={styles.itemTitle} numberOfLines={2}>
        {item.nom}
      </Text>
      
      <View style={styles.actionButtons}>
        <Pressable 
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.5 }]} 
            onPress={() => handleEdit(item)}
        >
          <Ionicons name="create-outline" size={22} color="#333" />
        </Pressable>

        <Pressable 
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.5 }]} 
            onPress={() => handleDelete(item.id, item.nom)}
        >
          <Ionicons name="trash-outline" size={22} color="#E53935" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="black" />
        </Pressable>
        <Text style={styles.headerTitle}>Gestion des défis</Text>
      </View>

      {/* BARRE DE RECHERCHE */}
      <View style={styles.searchContainer}>
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

      {/* LISTE */}
      {chargement ? (
        <View style={styles.center}><Text>Chargement...</Text></View>
      ) : (
        <FlatList
          data={filteredDefis}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun défi trouvé.</Text>}
        />
      )}

      {/* BOUTON FLOTTANT D'AJOUT (+) */}
      <Pressable style={styles.fab} onPress={handleAdd}>
        <Ionicons name="add" size={32} color="white" />
      </Pressable>

      {/* --- MODAL DE FORMULAIRE (AJOUT / ÉDITION) --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? "Modifier le défi" : "Ajouter un défi"}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={26} color="#333" />
              </Pressable>
            </View>

            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              
              <Text style={styles.label}>Nom du défi *</Text>
              <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Ex: Ramasser des déchets" />

              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Brève description..." multiline />

              <Text style={styles.label}>Pourquoi est-ce important ?</Text>
              <TextInput style={[styles.input, styles.textArea]} value={pourquoi} onChangeText={setPourquoi} placeholder="Expliquez l'impact écologique..." multiline />

              <Text style={styles.label}>Catégories (séparées par des virgules)</Text>
              <TextInput style={styles.input} value={categorie} onChangeText={setCategorie} placeholder="Ex: Déchets, Nature, Eau" />

              <View style={styles.row}>
                <View style={{flex: 1, marginRight: 10}}>
                  <Text style={styles.label}>Points CO2</Text>
                  <TextInput style={styles.input} value={co2} onChangeText={setCo2} placeholder="Ex: 10" keyboardType="numeric" />
                </View>
                <View style={{flex: 1}}>
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

              <View style={{height: 40}} />
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
  // --- BASE ---
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 70 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  // --- HEADER ---
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000' },

  // --- RECHERCHE ---
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 12, paddingHorizontal: 15, height: 48 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },

  // --- LISTE ---
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  listItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EFEFEF',
    padding: 16, borderRadius: 12, marginBottom: 12,
  },
  itemTitle: { flex: 1, fontSize: 15, fontWeight: '500', color: '#333', paddingRight: 10 },
  actionButtons: { flexDirection: 'row', gap: 12 },
  iconButton: { padding: 4 },
  emptyText: { marginTop: 30, textAlign: "center", color: "#888", fontStyle: 'italic' },

  // --- FAB ---
  fab: {
    position: 'absolute', bottom: 30, right: 25,
    backgroundColor: '#65B369', width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8,
  },

  // --- MODAL ---
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: '#fff',
    height: '90%',
    borderTopLeftRadius: 25, borderTopRightRadius: 25,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  
  // --- FORMULAIRE ---
  formScroll: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 15 },
  input: {
    backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 10, padding: 12, fontSize: 15, color: '#333',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  labelSwitch: { fontSize: 15, fontWeight: '500', color: '#333' },

  // --- BOUTONS MODAL ---
  modalFooter: { flexDirection: 'row', gap: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  button: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonCancel: { backgroundColor: '#F0F0F0' },
  buttonCancelText: { color: '#333', fontWeight: 'bold', fontSize: 15 },
  buttonSave: { backgroundColor: '#65B369' },
  buttonSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});