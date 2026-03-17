import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

// ==========================================
// CATÉGORIES
// ==========================================
export const getCategoryConfig = (category: string) => {
  if (!category) return { icon: 'leaf-outline', color: '#65B369', bg: '#E8F5E9' };
  
  const lowerCat = category.toLowerCase().trim();

  if (lowerCat.includes('déchet') || lowerCat.includes('dechet')) 
    return { icon: 'trash-outline', color: '#8D6E63', bg: '#EFEBE9' };
  if (lowerCat.includes('recyclage')) 
    return { icon: 'sync-outline', color: '#2E7D32', bg: '#E8F5E9' };
  if (lowerCat.includes('énergie') || lowerCat.includes('energie')) 
    return { icon: 'flash-outline', color: '#F57C00', bg: '#FFF3E0' };
  if (lowerCat.includes('eau')) 
    return { icon: 'water-outline', color: '#0288D1', bg: '#E1F5FE' };
  if (lowerCat.includes('consommation')) 
    return { icon: 'cart-outline', color: '#8E24AA', bg: '#F3E5F5' }; 
  if (lowerCat.includes('ressource')) 
    return { icon: 'cube-outline', color: '#00838F', bg: '#E0F7FA' }; 
  if (lowerCat.includes('mobilité')) 
    return { icon: 'bicycle-outline', color: '#1565C0', bg: '#E3F2FD' }; 
  if (lowerCat.includes('transport')) 
    return { icon: 'car-outline', color: '#1565C0', bg: '#E3F2FD' }; 
  if (lowerCat.includes('engagement')) 
    return { icon: 'megaphone-outline', color: '#C62828', bg: '#FFEBEE' };
  
  // Par défaut (Plante)
  return { icon: 'leaf-outline', color: '#65B369', bg: '#E8F5E9' }; 
};

// ==========================================
// BARRE DE RECHERCHE
// ==========================================
export const SearchBar = ({ value, onChangeText, onFilterPress, placeholder = "Rechercher..." }: any) => (
  <View style={styles.searchHeader}>
    <View style={styles.searchBar}>
      <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
      <TextInput
        placeholder={placeholder}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#888"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")} hitSlop={10}>
          <Ionicons name="close-circle" size={18} color="#888" />
        </Pressable>
      )}
    </View>

    <Pressable style={styles.filterButton} onPress={onFilterPress}>
      <Ionicons name="options-outline" size={24} color="#fff" />
    </Pressable>
  </View>
);

// ==========================================
// CARTE DE DÉFI 
// ==========================================
export const DefiCard = ({ item, onPress, cardWidth }: any) => {
  const categories = Array.isArray(item.categorie) && item.categorie.length > 0 
    ? item.categorie 
    : ['Général'];

  return (
    <Pressable style={[styles.card, { width: cardWidth }]} onPress={onPress}>
      
      <View style={styles.cardHeader}>
        <View style={styles.categoriesIconGroup}>
          {categories.map((cat: string, index: number) => {
            const config = getCategoryConfig(cat);
            return (
              <View 
                key={index} 
                style={[
                  styles.catIconWrapper, 
                  { 
                    backgroundColor: config.bg,
                    marginLeft: index > 0 ? -10 : 0,
                    zIndex: categories.length - index 
                  }
                ]}
              >
                <Ionicons name={config.icon as any} size={16} color={config.color} />
              </View>
            );
          })}
        </View>

        <View style={styles.badge}>
          <Ionicons name="cloudy-outline" size={12} color="#4FC3F7" style={{ marginRight: 4 }} />
          <Text style={styles.badgeText}>{item.co2 || 0} kg</Text>
        </View>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.nom}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.difficultyText}>Difficulté : {item.difficulte || 1}/5</Text>
        <Ionicons name="arrow-forward-circle" size={22} color="#E0E0E0" />
      </View>
    </Pressable>
  );
};

// --- STYLES DES COMPOSANTS ---
const styles = StyleSheet.create({
  // SearchBar Styles
  searchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10, gap: 12 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, paddingHorizontal: 15, height: 50,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  input: { flex: 1, fontSize: 15, color: '#333' },
  filterButton: {
    width: 50, height: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#65B369',
    borderRadius: 16, shadowColor: "#65B369", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },

  // DefiCard Styles
  card: {
    backgroundColor: "#fff", padding: 15, borderRadius: 20, justifyContent: "space-between",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  
  // Styles pour les icônes superposées
  categoriesIconGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  catIconWrapper: { 
    width: 34, 
    height: 34, 
    borderRadius: 17, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff' 
  },

  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E1F5FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 10 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#0277BD' },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#1A1A1A", lineHeight: 22, marginBottom: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10 },
  difficultyText: { fontSize: 13, color: '#888', fontWeight: '600' },
});