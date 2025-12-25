import React from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { COLORS } from '../../constants/colors';

export default function AuthContainer({ children }: { children: React.ReactNode }) {
  return (
    // Permet de remonter l'écran quand le clavier s'ouvre
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.mainContainer}
    >
      <View style={styles.content}>
        <View style={styles.card}>
          {/* La décoration en haut (le demi-cercle) */}
          <View style={styles.headerDecoration} />
          
          {/* Le logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/images/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain" // Garde les proportions de l'image
            />
          </View>

          {/* Le contenu */}
          <View style={styles.formContent}>
            {children}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundGrey,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 50,
  },
  card: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 30,
    width: '100%',
    position: 'relative', 
    paddingBottom: 30,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerDecoration: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    width: 120,
    height: 80,
    backgroundColor: COLORS.primaryBlue,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 1,
  },
  logoContainer: {
    position: 'absolute',
    top: -25,
    alignSelf: 'center',
    zIndex: 2,
    flexDirection: 'row',
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  formContent: {
    marginTop: 60,
    paddingHorizontal: 25,
    alignItems: 'center',
  },
});