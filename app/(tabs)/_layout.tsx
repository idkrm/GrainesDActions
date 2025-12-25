import { Tabs } from "expo-router";
import React from "react";
import { Text, View } from 'react-native';
import { COLORS } from "../constants/colors";

import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// fonction pour afficher le nombre de points
const PointsBadge = () => {
  const points = 1250; // à modifier pour que ça soit dynamique

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f0f0f0',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginRight: 15,
    }}>
      <Ionicons name="leaf" size={16} color={COLORS.primaryGreen} style={{ marginRight: 5 }} />

      <Text style={{ fontWeight: 'bold', color: '#333' }}>
        {points}
      </Text>
    </View>
  );
};

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        // barre de navigation
        tabBarShowLabel: false,

        tabBarStyle: {
          backgroundColor: 'white',
          height: 100,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: 'grey',
          paddingTop: 20,
        },
        tabBarActiveTintColor: COLORS.primaryGreen,

        // header
        headerTitleAlign: 'left',
        headerTitleStyle: {
          fontSize: 24,
        },

        headerLeftContainerStyle: {
          paddingLeft: 20,
        },

        headerRight: () => <PointsBadge />,

        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: 'white', 
          height: 100, 
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? COLORS.primaryGreen : 'transparent',
              borderRadius: 30,
              height: 50,
              width: 50,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: focused ? 5 : 0
            }}>
              <Ionicons
                name="home"
                color='black'
                size={24}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="challenge"
        options={{
          title: "Défis",
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? COLORS.primaryGreen : 'transparent',
              borderRadius: 30,
              height: 50,
              width: 50,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: focused ? 5 : 0
            }}>
              <Feather
                name='target'
                color='black'
                size={24} /></View>
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Classement",
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? COLORS.primaryGreen : 'transparent',
              borderRadius: 30,
              height: 50,
              width: 50,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: focused ? 5 : 0
            }}>
              <MaterialIcons
                name='leaderboard'
                color='black'
                size={24} /></View>
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Boutique",
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? COLORS.primaryGreen : 'transparent',
              borderRadius: 30,
              height: 50,
              width: 50,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: focused ? 5 : 0
            }}>
              <Entypo
                name='shop'
                color='black'
                size={24} /></View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? COLORS.primaryGreen : 'transparent',
              borderRadius: 30,
              height: 50,
              width: 50,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: focused ? 5 : 0
            }}>
              <FontAwesome6
                name='face-grin-wide'
                color='black'
                size={24} /></View>
          ),
        }}
      />
    </Tabs>
  );
}
