import { auth } from '@/firebaseBD/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type EditModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (newValue: string) => void;
  field: 'pseudo' | 'email' | 'password' | null;
  currentValue: string;
};

export default function EditModal({ visible, onClose, onSave, field, currentValue }: EditModalProps) {
  const [val1, setVal1] = useState(''); 
  const [val2, setVal2] = useState('');
  const [val3, setVal3] = useState(''); 

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (field === 'pseudo') {
        setVal1(currentValue); 
      } else {
        setVal1('');
      }
      setVal2('');
      setVal3('');
    }
  }, [visible, field, currentValue]);

  const handleSave = async () => {
    if (field === 'email') {
      if (val1 !== val2) {
        Alert.alert("Erreur", "Les adresses mail ne correspondent pas.");
        return; 
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val1)) {
        Alert.alert("Erreur", "Format d'adresse mail invalide.");
        return; 
      }
   
      onSave(val1);
      onClose();
    } 

    else if (field === 'password') {
      if (!val1 || !val2 || !val3) {
        Alert.alert("Erreur", "Veuillez remplir tous les champs.");
        return;
      }
      if (val2 !== val3) {
        Alert.alert("Erreur", "Les nouveaux mots de passe ne correspondent pas.");
        return;
      }
      
      if (val2.length < 6) {
        Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères.");
        return;
      }
      if (!/[0-9]/.test(val2)) {
        Alert.alert("Erreur", "Le mot de passe doit contenir au moins un chiffre.");
        return;
      }
      if (!/[!@#$%^&*(),.?":{}|<>\-_]/.test(val2)) {
        Alert.alert("Erreur", "Le mot de passe doit contenir au moins un caractère spécial.");
        return;
      }

      const user = auth.currentUser;
      if (user && user.email) {
        setLoading(true);
        const credential = EmailAuthProvider.credential(user.email, val1);

        try {
          await reauthenticateWithCredential(user, credential);
          
          onSave(val2);
          onClose();
        } catch (error: any) {
          // console.error("Erreur de réauthentification :", error);
          if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            Alert.alert("Accès refusé", "L'ancien mot de passe est incorrect.");
          } else {
            Alert.alert("Erreur", "Impossible de vérifier l'ancien mot de passe.");
          }
        } finally {
          setLoading(false);
        }
      } else {
         Alert.alert("Erreur", "Utilisateur non connecté.");
      }
    } 
  
    else {
      if (!val1 || val1.trim().length === 0) {
        Alert.alert("Erreur", "Le pseudo ne peut pas être vide.");
        return;
      }
      
      onSave(val1);
      onClose();
    }
  };

  const getHeaderIcon = () => {
    switch (field) {
      case 'pseudo': return { icon: "person-outline", color: "#65B369", bg: "#E8F5E9" };
      case 'email': return { icon: "mail-outline", color: "#4FC3F7", bg: "#E1F5FE" };
      case 'password': return { icon: "lock-closed-outline", color: "#F57C00", bg: "#FFF3E0" };
      default: return { icon: "create-outline", color: "#666", bg: "#F5F5F5" };
    }
  };

  const getTitle = () => {
    switch (field) {
      case 'pseudo': return "Modifier le pseudo";
      case 'email': return "Modifier l'adresse mail";
      case 'password': return "Changer de mot de passe";
      default: return "Modifier";
    }
  };

  const headerConfig = getHeaderIcon();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          
          {/* ICON HEADER */}
          <View style={[styles.iconContainer, { backgroundColor: headerConfig.bg }]}>
            <Ionicons name={headerConfig.icon as any} size={28} color={headerConfig.color} />
          </View>
          
          <Text style={styles.modalTitle}>{getTitle()}</Text>

          {/* INPUTS */}
          <View style={styles.inputsWrapper}>
            {field === 'password' && (
              <>
                <Text style={styles.inputLabel}>Mot de passe actuel</Text>
                <TextInput
                  style={styles.input}
                  value={val1}
                  onChangeText={setVal1}
                  placeholder="Saisissez votre mot de passe"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
                
                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Nouveau mot de passe</Text>
                <TextInput
                  style={styles.input}
                  value={val2}
                  onChangeText={setVal2}
                  placeholder="Min. 6 caractères, 1 chiffre, 1 carac. spé."
                  placeholderTextColor="#999"
                  secureTextEntry
                />
                <TextInput
                  style={[styles.input, { marginTop: 10 }]}
                  value={val3}
                  onChangeText={setVal3}
                  placeholder="Confirmez le nouveau mot de passe"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </>
            )}

            {field === 'email' && (
              <>
                <Text style={styles.inputLabel}>Nouveau contact</Text>
                <TextInput
                  style={styles.input}
                  value={val1}
                  onChangeText={setVal1}
                  placeholder="Nouvelle adresse mail"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={[styles.input, { marginTop: 10 }]}
                  value={val2}
                  onChangeText={setVal2}
                  placeholder="Confirmez l'adresse mail"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </>
            )}

            {field === 'pseudo' && (
              <>
                <Text style={styles.inputLabel}>Comment doit-on t'appeler ?</Text>
                <TextInput
                  style={styles.input}
                  value={val1}
                  onChangeText={setVal1}
                  placeholder="Nouveau pseudo"
                  placeholderTextColor="#999"
                />
              </>
            )}
          </View>

          {/* BOUTONS */}
          <View style={styles.buttonContainer}>
            <Pressable 
              style={[styles.button, styles.buttonCancel]} 
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.textCancel}>Annuler</Text>
            </Pressable>

            <Pressable 
              style={[styles.button, styles.buttonSave]} 
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                 <ActivityIndicator color="#fff" size="small" />
              ) : (
                 <Text style={styles.textSave}>Valider</Text>
              )}
            </Pressable>
          </View>
          
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 20,
  },
  modalView: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 25,
  },

  // Inputs
  inputsWrapper: {
    width: '100%',
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#1A1A1A',
  },

  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 14,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCancel: {
    backgroundColor: '#F5F5F5',
  },
  buttonSave: {
    backgroundColor: '#65B369',
    shadowColor: "#65B369",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  textCancel: {
    color: '#555',
    fontWeight: '700',
    fontSize: 16,
  },
  textSave: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },
});