import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

// --- TYPE ---
interface ValidationItem {
  id: string;
  defiNom: string;
  username: string;
  dateSoumission: string;
  imageUri?: string; // L'URL de la photo prise par l'utilisateur
}

export default function ValidationDefisScreen() {
  const router = useRouter();

  const [validations, setValidations] = useState<ValidationItem[]>([]);
  const [chargement, setChargement] = useState(true);
  const [searchText, setSearchText] = useState("");
  
  // État pour gérer l'élément sélectionné pour le Modal
  const [selectedItem, setSelectedItem] = useState<ValidationItem | null>(null);

  // --- CHARGEMENT DES DONNÉES (Simulation) ---
  useEffect(() => {
    // Ici, tu remplaceras par ton appel Firebase (ex: collection "ValidationsEnAttente")
    // Pour l'instant, je mets des données factices pour que tu puisses voir le design
    const loadMockData = () => {
      const mockData: ValidationItem[] = [
        {
          id: "v1",
          defiNom: "Composter ses déchets organiques",
          username: "user77983",
          dateSoumission: "12/02/2026"
        },
        {
          id: "v2",
          defiNom: "Limiter l'utilisation de la voiture",
          username: "userflow",
          dateSoumission: "01/02/2026"
        },
        {
          id: "v3",
          defiNom: "Ramasser des déchets dans la nature",
          username: "ecowarrior21",
          dateSoumission: "26/09/2023"
        }
      ];
      setValidations(mockData);
      setChargement(false);
    };

    loadMockData();
  }, []);

  // --- FILTRAGE ---
  const filteredValidations = validations.filter((v) =>
    v.defiNom.toLowerCase().includes(searchText.toLowerCase()) ||
    v.username.toLowerCase().includes(searchText.toLowerCase())
  );

  // --- ACTIONS ---
  const handleValidate = () => {
    // Logique Firebase pour valider (donner les points au user, supprimer de l'attente)
    Alert.alert("Succès", `Le défi de ${selectedItem?.username} a été validé !`);
    
    // On retire l'élément de la liste locale pour mettre à jour l'UI
    setValidations(prev => prev.filter(v => v.id !== selectedItem?.id));
    setSelectedItem(null); // Ferme le modal
  };

  const handleReject = () => {
    // Logique Firebase pour refuser
    Alert.alert("Refusé", `Le défi de ${selectedItem?.username} a été refusé.`);
    
    setValidations(prev => prev.filter(v => v.id !== selectedItem?.id));
    setSelectedItem(null); // Ferme le modal
  };

  // --- RENDU D'UNE LIGNE ---
  const renderItem = ({ item }: { item: ValidationItem }) => (
    <View style={styles.listItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.defiNom}
        </Text>
        <Text style={styles.itemSubtitle}>par {item.username} le {item.dateSoumission}</Text> 
      </View>
      
      {/* Bouton Œil pour ouvrir le Modal */}
      <Pressable 
        style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.5 }]} 
        onPress={() => setSelectedItem(item)}
      >
        <Ionicons name="eye-outline" size={26} color="#333" />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="black" />
        </Pressable>
        <Text style={styles.headerTitle}>Validation de défi</Text>
      </View>

      {/* BARRE DE RECHERCHE */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Rechercher un défi ou utilisateur..."
            style={styles.searchInput}
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
      </View>

      {/* LISTE DES VALIDATIONS */}
      {chargement ? (
        <View style={styles.center}>
          <Text>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredValidations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun défi en attente de validation.</Text>
          }
        />
      )}

      {/* --- MODAL DE VALIDATION CENTRÉ --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!selectedItem}
        onRequestClose={() => setSelectedItem(null)}
      >
        {/* L'Overlay devient un bouton pour fermer en cliquant à côté */}
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedItem(null)}>
          
          {/* Contenu du Modal (onPress vide pour bloquer la fermeture si on clique dedans) */}
          <Pressable style={styles.modalContent} onPress={() => {}}>
            
            {/* Bouton Fermer (X) */}
            <Pressable style={styles.closeButton} onPress={() => setSelectedItem(null)}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>

            {/* Titre et Sous-titre */}
            <Text style={styles.modalTitle}>{selectedItem?.defiNom}</Text>
            <Text style={styles.modalSubtitle}>par <Text style={{fontWeight: 'bold'}}>{selectedItem?.username}</Text> le <Text style={{fontWeight: 'bold'}}>{selectedItem?.dateSoumission}</Text></Text>

            {/* Image soumise */}
            <View style={styles.modalImageContainer}>
              {selectedItem?.imageUri ? (
                <Image source={{ uri: selectedItem.imageUri }} style={styles.modalImage} resizeMode="cover" />
              ) : (
                <View style={[styles.modalImage, styles.placeholderImage]}>
                  <Ionicons name="image-outline" size={40} color="#aaa" />
                  <Text style={{color: '#aaa', marginTop: 10}}>Aucune image fournie</Text>
                </View>
              )}
            </View>

            {/* Boutons d'action (Valider / Refuser) */}
            <View style={styles.actionButtonsRow}>
              <Pressable style={[styles.actionButton, styles.buttonValidate]} onPress={handleValidate}>
                <Text style={styles.buttonText}>Valider le défi</Text>
              </Pressable>
              
              <Pressable style={[styles.actionButton, styles.buttonReject]} onPress={handleReject}>
                <Text style={styles.buttonText}>Refuser</Text>
              </Pressable>
            </View>

          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 70, // Safe area
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  
  // --- HEADER ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: { marginRight: 15 },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },

  // --- BARRE DE RECHERCHE ---
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },

  // --- LISTE ---
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 15,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 1, // Petite ombre Android
    shadowColor: "#000", // Petite ombre iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
  },
  emptyText: {
    marginTop: 30,
    textAlign: "center",
    color: "#888",
    fontStyle: 'italic',
  },

  // --- MODAL ---
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    paddingTop: 35, // Plus d'espace pour la croix
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalImageContainer: {
    width: '100%',
    aspectRatio: 1, // Rend l'image carrée
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 25,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Boutons du modal
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15, // Espace entre les deux boutons
  },
  actionButton: {
    flex: 1, // Les boutons prennent une largeur égale
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonValidate: {
    backgroundColor: '#81C784', // Vert doux (proche de ton vert)
  },
  buttonReject: {
    backgroundColor: '#E57373', // Rouge/Corail doux
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
});