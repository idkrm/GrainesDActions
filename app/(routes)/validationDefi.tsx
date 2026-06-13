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

const CLOUDINARY_CLOUD_NAME = 'dvlayvzr0';
const CLOUDINARY_UPLOAD_PRESET = 'graines_preuves';

const uploadToCloudinary = async (
    uri: string,
    mimeType: string,
    fileName: string
): Promise<string> => {
  const formData = new FormData();

  formData.append('file', {
    uri,
    type: mimeType,
    name: fileName,
  } as any);

  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'preuves_defis');

  const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cloudinary error: ${err}`);
  }

  const data = await response.json();
  return data.secure_url as string;
};

export default function SubmitProofScreen() {
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const defiId = Array.isArray(id) ? id[0] : id;

  const [mediaUri, setMediaUri]   = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'camera' | 'pdf' | null>(null);
  const [mimeType, setMimeType]   = useState<string>('image/jpeg');
  const [fileName, setFileName]   = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectMedia = () => {
    Alert.alert(
        "Ajouter une preuve",
        "Comment souhaites-tu fournir ta preuve ?",
        [
          { text: "Prendre une photo / vidéo", onPress: pickFromCamera },
          { text: "Choisir un fichier (PDF)",   onPress: pickPDF },
          { text: "Annuler", style: "cancel" },
        ]
    );
  };

  const pickFromCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission requise", "Vous devez autoriser l'accès à la caméra.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video';
        setMediaUri(asset.uri);
        setMediaType('camera');
        setMimeType(isVideo ? 'video/mp4' : 'image/jpeg');
        setFileName(`preuve_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`);
      }
    } catch (error) {
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
        const asset = result.assets[0];
        setMediaUri(asset.uri);
        setMediaType('pdf');
        setMimeType('application/pdf');
        setFileName(asset.name);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de récupérer le fichier.");
    }
  };

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
      const preuveUrl = await uploadToCloudinary(
          mediaUri,
          mimeType,
          fileName ?? `preuve_${Date.now()}`
      );

      const userRef    = doc(db, "Users", user.uid);
      const counterRef = doc(db, "Counters", "HistoriqueDefis");
      const currentId  = String(defiId);

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("Utilisateur introuvable.");

        const defiEnCoursRaw = (userSnap.data()?.defi_en_cours ?? []) as any[];
        if (!defiEnCoursRaw.some((v) => String(v) === currentId)) {
          throw new Error("Ce défi n'est pas dans vos défis en cours.");
        }

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

        const historiqueRef = doc(db, "HistoriqueDefis", String(nextId));
        transaction.set(historiqueRef, {
          DefisID:        currentId,
          UserID:         user.uid,
          Pseudo:         userSnap.data()?.pseudo || "Utilisateur",
          DateValidation: serverTimestamp(),
          State:          "En cours",
          // ↓ URL publique Cloudinary (lisible par l'app web admin)
          PreuveUrl:      preuveUrl,
          PreuveType:     mediaType,
          PreuveMimeType: mimeType,
          PreuveName:     fileName || "Preuve",
        });

        const newList = defiEnCoursRaw.filter((v) => String(v) !== currentId);
        transaction.update(userRef, { defi_en_cours: newList });
      });

      Alert.alert("Super ! 🎉", "Ta preuve a été soumise pour vérification !");
      router.replace("/(tabs)");

    } catch (e: any) {
      console.error(e);
      Alert.alert("Erreur", e?.message ?? "Impossible de soumettre le défi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <View style={styles.mainContainer}>

        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={15} disabled={isSubmitting}>
            <Ionicons name="arrow-back" size={28} color="#1A1A1A" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.headerTitles}>
            <Text style={styles.title}>Preuve d'action</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#65B369" style={{ marginRight: 10 }} />
              <Text style={styles.cardTitle}>Validation requise</Text>
            </View>

            <Text style={styles.cardDescription}>
              Ajoute une photo, une vidéo ou un document PDF pour attester de ta bonne action.{' '}
              Tes points te seront crédités dans un délai de <Text style={{ fontWeight: 'bold' }}>3 jours ouvrés</Text>.
            </Text>

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
                    <Text style={styles.uploadSubtitle}>Formats acceptés : JPG, PNG, MP4, PDF</Text>
                  </View>
              )}
            </Pressable>
          </View>

        </ScrollView>

        <View style={styles.footerContainer}>
          <Pressable
              style={[styles.submitButton, (!mediaUri || isSubmitting) && styles.submitButtonDisabled]}
              onPress={handleValidate}
              disabled={!mediaUri || isSubmitting}
          >
            {isSubmitting ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <>
                  <Text style={styles.submitButtonText}>Envoyer ma preuve</Text>
                  <Ionicons name="paper-plane-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </>
            )}
          </Pressable>
        </View>

      </View>
  );
}

const styles = StyleSheet.create({
  mainContainer:    { flex: 1, backgroundColor: '#FAFAFA', paddingTop: 50 },
  scrollContent:    { paddingHorizontal: 20, paddingBottom: 100 },
  headerTop:        { paddingHorizontal: 20, marginBottom: 10 },
  backButton:       { alignSelf: 'flex-start', padding: 5, marginLeft: -5 },
  headerTitles:     { marginBottom: 30 },
  title:            { fontSize: 28, fontWeight: '900', color: '#1A1A1A' },
  card:             { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  cardHeader:       { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle:        { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  cardDescription:  { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 25 },
  uploadArea:       { width: '100%', height: 220, borderWidth: 2, borderColor: '#C8E6C9', borderStyle: 'dashed', borderRadius: 20, backgroundColor: '#F9FCF9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  uploadAreaFilled: { borderStyle: 'solid', borderWidth: 0, backgroundColor: '#fff' },
  emptyState:       { alignItems: 'center', justifyContent: 'center', padding: 20 },
  iconCircle:       { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  uploadTitle:      { fontSize: 16, fontWeight: '700', color: '#2E7D32', marginBottom: 6, textAlign: 'center' },
  uploadSubtitle:   { fontSize: 13, color: '#666', textAlign: 'center' },
  previewContainer: { width: '100%', height: '100%', position: 'relative', borderRadius: 20, overflow: 'hidden', backgroundColor: '#F5F5F5' },
  previewImage:     { width: '100%', height: '100%' },
  pdfPreview:       { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  pdfName:          { marginTop: 15, fontSize: 14, textAlign: 'center', color: '#333', fontWeight: '600' },
  changeOverlay:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  changeText:       { color: 'white', fontSize: 14, fontWeight: 'bold', marginLeft: 6 },
  footerContainer:  { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 35, paddingTop: 15, backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  submitButton:         { flexDirection: 'row', backgroundColor: '#65B369', paddingVertical: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: "#65B369", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  submitButtonDisabled: { backgroundColor: '#A5D6A7', shadowOpacity: 0, elevation: 0 },
  submitButtonText:     { color: '#fff', fontSize: 17, fontWeight: '800' },
});