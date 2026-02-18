import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

// NOUVEAUX IMPORTS FIREBASE
import { auth, db } from "@/firebaseBD/firebaseConfig";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";

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
      "Comment souhaitez-vous fournir votre preuve ?",
      [
        { text: "Prendre une photo / vidéo", onPress: pickFromCamera },
        { text: "Choisir un fichier (PDF uniquement)", onPress: pickPDF },
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
      console.error("Erreur Caméra :", error);
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
      console.error("Erreur PDF :", error);
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
        // 1. Vérifier l'utilisateur et ses défis en cours
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("Utilisateur introuvable.");

        const defiEnCoursRaw = (userSnap.data()?.defi_en_cours ?? []) as any[];
        if (!defiEnCoursRaw.some((v) => String(v) === currentId)) {
          throw new Error("Ce défi n'est pas dans vos défis en cours.");
        }

        // 2. Gérer le compteur pour le nouvel ID d'historique
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

        // 3. Créer l'entrée dans l'historique avec le statut "En cours" ET la preuve
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

        // 4. Retirer le défi de "defi_en_cours" de l'utilisateur
        const newList = defiEnCoursRaw.filter((v) => String(v) !== currentId);
        transaction.update(userRef, { defi_en_cours: newList });
      });

      Alert.alert("Super !", "Votre preuve a été soumise pour vérification !");
      router.replace("/(tabs)");

    } catch (e: any) {
      console.error(e);
      Alert.alert("Erreur", e?.message ?? "Impossible de soumettre le défi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </Pressable>
        <Text style={styles.headerTitle}>Défi</Text>
      </View>

      {/* CONTENU PRINCIPAL */}
      <View style={styles.content}>
        
        <Pressable style={styles.uploadBox} onPress={handleSelectMedia} disabled={isSubmitting}>
          <Text style={styles.boxTitle}>Validation du défi</Text>
          <Text style={styles.boxSubtitle}>
            Veuillez fournir une preuve.{'\n'}
            Vos points seront crédités dans un délai de 3 jours ouvrés.
          </Text>

          {/* AFFICHAGE CONDITIONNEL (Photo vs PDF vs Rien) */}
          {mediaUri ? (
            <View style={styles.previewContainer}>
              {mediaType === 'camera' ? (
                <Image source={{ uri: mediaUri }} style={styles.previewImage} resizeMode="cover" />
              ) : (
                <View style={styles.pdfPreview}>
                  <Ionicons name="document-text" size={60} color="#E53935" />
                  <Text style={styles.pdfName} numberOfLines={2}>{fileName}</Text>
                </View>
              )}

              <View style={styles.changeOverlay}>
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.changeText}>Changer</Text>
              </View>
            </View>
          ) : (
            <View style={styles.iconCircle}>
              <Ionicons name="push-outline" size={50} color="#000"/>
            </View>
          )}
        </Pressable>

        {/* BOUTON VALIDER */}
        <Pressable 
          style={[
            styles.validateButton, 
            (!mediaUri || isSubmitting) && styles.validateButtonDisabled
          ]} 
          onPress={handleValidate}
          disabled={!mediaUri || isSubmitting}
        >
          {isSubmitting ? (
             <ActivityIndicator color="#000" />
          ) : (
             <Text style={styles.validateButtonText}>Valider</Text>
          )}
        </Pressable>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 70 },
  
  // HEADER
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 30, justifyContent: 'space-between' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginLeft: 10, flex: 1 },

  // CONTENU
  content: { flex: 1, paddingHorizontal: 30, alignItems: 'center' },

  // ENCADRÉ
  uploadBox: {
    width: '100%', height: '80%',
    borderWidth: 2, borderColor: '#65B369', borderRadius: 15, padding: 20,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA',
  },
  boxTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginTop: 20, marginBottom: 20 },
  boxSubtitle: { fontSize: 14, color: '#333', textAlign: 'center', lineHeight: 20, marginBottom: 40, paddingHorizontal: 10 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#000', justifyContent: 'center', alignItems: 'center' },

  // APERÇU (Image ou PDF)
  previewContainer: {
    width: 160, height: 160, borderRadius: 15, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#fff',
  },
  previewImage: { width: '100%', height: '100%' },
  pdfPreview: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10 },
  pdfName: { marginTop: 10, fontSize: 12, textAlign: 'center', color: '#333', fontWeight: '500' },
  changeOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 6,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  changeText: { color: 'white', fontSize: 13, fontWeight: 'bold' },

  // BOUTON
  validateButton: {
    backgroundColor: '#C5E1C5', paddingVertical: 15, paddingHorizontal: 60, borderRadius: 30,
    marginTop: 40, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 2,
    minWidth: 180, alignItems: 'center'
  },
  validateButtonDisabled: { opacity: 0.5 },
  validateButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});