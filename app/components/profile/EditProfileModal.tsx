import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '../../../constants/colors';

type EditModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (newValue: string) => void;
  field: 'pseudo' | 'email' | 'password' | null;
  currentValue: string;
};

export default function EditModal({ visible, onClose, onSave, field, currentValue }: EditModalProps) {
  const [val1, setVal1] = useState(''); // le premier input box (son pseudo, ancien mdp ou nv mail)
  const [val2, setVal2] = useState(''); // deuxième input box (nv mdp ou retaper nv mail)
  const [val3, setVal3] = useState(''); // troisième input box (retaper nv mdp)

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

  const handleSave = () => {
    if (field === 'email') {
      if (val1 !== val2) {
        // TODO vérifier que ça correspond bien au format mail
        Alert.alert("Erreur", "Les adresses mail ne correspondent pas.");
        return;
      }
      onSave(val1);
    } 
    else if (field === 'password') {
      // TODO vérifier que le mdp contient bien tous les trucs de sécurité (au moins 6 caractères, 1 chiffre et 1 caractère spécial)
      if (!val1 || !val2 || !val3) {
        Alert.alert("Erreur", "Veuillez remplir tous les champs.");
        return;
      }
      if (val2 !== val3) {
        Alert.alert("Erreur", "Le nouveau mot de passe et sa confirmation ne correspondent pas.");
        return;
      }
      // TODO vérifier que l'ancien mdp (val1) correspond bien à ce qu'il y a dans firebase
      onSave(val2);
    } 
    else {
      onSave(val1);
    }
    
    onClose();
  };

  const getTitle = () => {
    switch (field) {
      case 'pseudo': return "Modifier le pseudo";
      case 'email': return "Changer d'adresse mail";
      case 'password': return "Changer le mot de passe";
      default: return "Modifier";
    }
  };

  const renderInputs = () => {
    switch (field) {
      case 'password':
        return (
          <>
            <TextInput
              style={styles.input}
              value={val1}
              onChangeText={setVal1}
              placeholder="Mot de passe actuel"
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={val2}
              onChangeText={setVal2}
              placeholder="Nouveau mot de passe"
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={val3}
              onChangeText={setVal3}
              placeholder="Confirmer le nouveau mot de passe"
              secureTextEntry
            />
          </>
        );

      case 'email':
        return (
          <>
            <TextInput
              style={styles.input}
              value={val1}
              onChangeText={setVal1}
              placeholder="Nouvelle adresse mail"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={val2}
              onChangeText={setVal2}
              placeholder="Confirmer l'adresse mail"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </>
        );

      case 'pseudo':
      default:
        return (
          <TextInput
            style={styles.input}
            value={val1}
            onChangeText={setVal1}
            placeholder="Nouveau pseudo"
          />
        );
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{getTitle()}</Text>

          <View style={{ width: '100%' }}>
            {renderInputs()}
          </View>

          <View style={styles.buttonContainer}>
            <Pressable style={[styles.button, styles.buttonCancel]} onPress={onClose}>
              <Text style={styles.textCancel}>Annuler</Text>
            </Pressable>

            <Pressable style={[styles.button, styles.buttonSave]} onPress={handleSave}>
              <Text style={styles.textSave}>Valider</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
    marginTop: 10,
  },
  button: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    flex: 1,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonSave: {
    backgroundColor: COLORS.primaryGreen,
  },
  textCancel: {
    color: '#333',
    fontWeight: '600',
  },
  textSave: {
    color: 'white',
    fontWeight: 'bold',
  },
});