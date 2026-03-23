import { auth, db } from "@/firebaseBD/firebaseConfig";
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function SubmitProofScreen() {
  const router = useRouter();
  
  // Récupération de l'ID du défi passé dans l'URL
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const defiId = Array.isArray(id) ? id[0] : id;

  // États pour stocker le fichier sélectionné
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'camera' | 'pdf' | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // État de chargement pour la soumission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LOGIQUE DE SÉLECTION ---
  const handleSelectMedia = () => {
    Alert.alert(
      "Ajouter une preuve",
      "Comment souhaites-tu fournir ta preuve ?",
      [
        { text: "Prendre une photo", onPress: pickFromCamera },
        { text: "Choisir un fichier (PDF)", onPress: pickPDF },
        { text: "Annuler", style: "cancel" },
      ]
    );
  };

  const pickFromCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission requise", "Vous devez autoriser l'accès à la caméra.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setMediaUri(result.assets[0].uri);
        setMediaType('camera');
        setFileName(null);
      }
    } catch (error) {
      // console.error("Erreur Caméra :", error);
      Alert.alert("Erreur", "Impossible d'ouvrir la caméra.");
    }
  };

  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setMediaUri(result.assets[0].uri);
        setMediaType('pdf');
        setFileName(result.assets[0].name);
      }
    } catch (error) {
      // console.error("Erreur PDF :", error);
      Alert.alert("Erreur", "Impossible de récupérer le fichier.");
    }
  };

  // --- LOGIQUE DE SOUMISSION FIREBASE ---
  const handleValidate = async () => {
    if (!mediaUri) {
      Alert.alert("Attention", "Veuillez d'abord fournir une preuve avant de valider.");
      return;
    }

    if (!defiId) {
      Alert.alert("Erreur", "Défi introuvable.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Connexion requise", "Vous devez être connecté(e).");
      return;
    }

    setIsSubmitting(true);

    try {
      const userRef = doc(db, "Users", user.uid);
      const counterRef = doc(db, "Counters", "HistoriqueDefis");
      const currentId = String(defiId);

      await runTransaction(db, async (transaction) => {
        // Vérifier l'utilisateur et ses défis en cours
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("Utilisateur introuvable.");

        const defiEnCoursRaw = (userSnap.data()?.defi_en_cours ?? []) as any[];
        if (!defiEnCoursRaw.some((v) => String(v) === currentId)) {
          throw new Error("Ce défi n'est pas dans vos défis en cours.");
        }

        // Gérer le compteur pour le nouvel ID d'historique
        const counterSnap = await transaction.get(counterRef);
        let nextId: number;

        if (!counterSnap.exists()) {
          nextId = 1;
          transaction.set(counterRef, { nextId: 2 });
        } else {
          const currentNextId = Number(counterSnap.data()?.nextId ?? 1);
          nextId = currentNextId;
          transaction.update(counterRef, { nextId: currentNextId + 1 });
        }

        // Créer l'entrée dans l'historique avec le statut "En cours" ET la preuve
        const historiqueRef = doc(db, "HistoriqueDefis", String(nextId));
        transaction.set(historiqueRef, {
          DefisID: currentId,
          UserID: user.uid,
          Pseudo: userSnap.data()?.pseudo || "Utilisateur",
          DateValidation: serverTimestamp(),
          State: "En cours", 
          PreuveUri: mediaUri,
          PreuveType: mediaType,
          PreuveName: fileName || "Photo",
        });

        // Retirer le défi de "defi_en_cours" de l'utilisateur
        const newList = defiEnCoursRaw.filter((v) => String(v) !== currentId);
        transaction.update(userRef, { defi_en_cours: newList });
      });

      Alert.alert("Super ! 🎉", "Ta preuve a été soumise pour vérification !");
      router.replace("/(tabs)");

    } catch (e: any) {
      // console.error(e);
      Alert.alert("Erreur", e?.message ?? "Impossible de soumettre le défi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      
      {/* HEADER TOP (Bouton retour) */}
      <View style={styles.headerTop}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={15} disabled={isSubmitting}>
          <Ionicons name="arrow-back" size={28} color="#1A1A1A" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* TITRES */}
        <View style={styles.headerTitles}>
          <Text style={styles.title}>Preuve d'action</Text>
        </View>

        {/* CARTE PRINCIPALE */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#65B369" style={{ marginRight: 10 }} />
            <Text style={styles.cardTitle}>Validation requise</Text>
          </View>
          
          <Text style={styles.cardDescription}>
            Ajoute une photo ou un document PDF pour attester de ta bonne action. 
            Tes points te seront crédités dans un délai de <Text style={{fontWeight: 'bold'}}>3 jours ouvrés</Text>.
          </Text>

          {/* ZONE D'UPLOAD */}
          <Pressable 
            style={[styles.uploadArea, mediaUri && styles.uploadAreaFilled]} 
            onPress={handleSelectMedia} 
            disabled={isSubmitting}
          >
            {mediaUri ? (
              <View style={styles.previewContainer}>
                {mediaType === 'camera' ? (
                  <Image source={{ uri: mediaUri }} style={styles.previewImage} resizeMode="cover" />
                ) : (
                  <View style={styles.pdfPreview}>
                    <Ionicons name="document-text" size={50} color="#E53935" />
                    <Text style={styles.pdfName} numberOfLines={2}>{fileName}</Text>
                  </View>
                )}
                
                <View style={styles.changeOverlay}>
                  <Ionicons name="refresh" size={18} color="white" />
                  <Text style={styles.changeText}>Changer de fichier</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.iconCircle}>
                  <Ionicons name="cloud-upload-outline" size={32} color="#65B369" />
                </View>
                <Text style={styles.uploadTitle}>Appuie pour ajouter un fichier</Text>
                <Text style={styles.uploadSubtitle}>Formats acceptés : JPG, PNG, PDF</Text>
              </View>
            )}
          </Pressable>
        </View>

      </ScrollView>

      {/* FOOTER FLOATING - BOUTON VALIDER */}
      <View style={styles.footerContainer}>
        <Pressable 
          style={[
            styles.submitButton, 
            (!mediaUri || isSubmitting) && styles.submitButtonDisabled
          ]} 
          onPress={handleValidate}
          disabled={!mediaUri || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Envoyer ma preuve</Text>
              <Ionicons name="paper-plane-outline" size={20} color="#fff" style={{marginLeft: 8}} />
            </>
          )}
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA', 
    paddingTop: 50,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // --- HEADER ---
  headerTop: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 5,
    marginLeft: -5,
  },
  headerTitles: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },

  // --- CARTE ---
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  cardDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 25,
  },

  // --- ZONE D'UPLOAD ---
  uploadArea: {
    width: '100%',
    height: 220,
    borderWidth: 2,
    borderColor: '#C8E6C9', 
    borderStyle: 'dashed',
    borderRadius: 20,
    backgroundColor: '#F9FCF9', 
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadAreaFilled: {
    borderStyle: 'solid',
    borderWidth: 0,
    backgroundColor: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 6,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },

  // --- APERÇU MEDIA ---
  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  pdfPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pdfName: {
    marginTop: 15,
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
    fontWeight: '600',
  },
  changeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },

  // --- FOOTER FLOATING ---
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 35,
    paddingTop: 15,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#65B369',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#65B369",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
});