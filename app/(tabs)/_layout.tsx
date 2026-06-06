import { COLORS } from "@/constants/colors";
import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from 'react-native';

import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { auth, db } from "@/firebaseBD/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

import * as Notifications from 'expo-notifications';
import { RediNotification } from '../components/notifications/RedirectNotification';


// fonction pour afficher le nombre de points
const PointsBadge = () => {
    const [points, setPoints] = useState<number>(0);

    useEffect(() => {
        const unsubAuth = auth.onAuthStateChanged((user) => {
            if (!user) {
                setPoints(0);
                return;
            }

            const userRef = doc(db, "Users", user.uid);
            const unsubUser = onSnapshot(
                userRef,
                (snap) => {
                    if (!snap.exists()) {
                        setPoints(0);
                        return;
                    }
                    const data = snap.data();
                    setPoints(Number(data?.nb_points ?? 0));
                },
                (err) => {
                    console.log("POINTS SNAPSHOT ERROR =>", err);
                    setPoints(0);
                }
            );

            return unsubUser;
        });

        return () => unsubAuth();
    }, []);

    return (
        <View style={styles.badgeContainer}>
            <Ionicons name="star" size={14} color="#F57C00" style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>{points} pts</Text>
        </View>
    );
};

const TabIcon = ({ focused, IconComponent, iconName }: any) => {
    return (
        <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
            <IconComponent
                name={iconName}
                color={focused ? COLORS.primaryGreen : '#999'}
                size={22} 
            />
        </View>
    );
};

// -- Configuration Notification --

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Affiche la notif
    shouldPlaySound: false, 
    shouldSetBadge: true, // Affiche l'icône au dessus de l'app
    shouldShowBanner: true, // Affiche la notif en haut de l'écran
    shouldShowList: false, 
  }),
});

export default function RootLayout() {
    
    return (
        <>
        <RediNotification  />

        <Tabs
            screenOptions={{
                // --- BARRE DE NAVIGATION (BOTTOM TAB) ---
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    height: Platform.OS === 'ios' ? 95 : 75,
                    borderTopLeftRadius: 30,
                    borderTopRightRadius: 30,
                    borderTopWidth: 0, 
                    position: 'absolute',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    elevation: 10, 
                },

                // --- HEADER (EN-TÊTE) ---
                headerTitleAlign: 'left',
                headerTitleStyle: {
                    fontSize: 24,
                    fontWeight: '900',
                    color: '#1A1A1A',
                },
                headerLeftContainerStyle: {
                    paddingLeft: 5,
                },
                headerRightContainerStyle: {
                    paddingRight: 15,
                },
                headerRight: () => <PointsBadge />,
                headerShadowVisible: false,
                headerStyle: {
                    backgroundColor: '#FAFAFA',
                    height: 110,
                }
            }}
        >
            
            <Tabs.Screen
                name="index"
                options={{
                    title: "Accueil",
                    tabBarIcon: ({ focused }) => <TabIcon focused={focused} IconComponent={Ionicons} iconName="home" />,
                }}
            />

            <Tabs.Screen
                name="challenge"
                options={{
                    title: "Catalogue des défis",
                    tabBarIcon: ({ focused }) => <TabIcon focused={focused} IconComponent={Feather} iconName="target" />,
                }}
            />

            <Tabs.Screen
                name="leaderboard"
                options={{
                    title: "Classement",
                    tabBarIcon: ({ focused }) => <TabIcon focused={focused} IconComponent={MaterialIcons} iconName="leaderboard" />,
                }}
            />

            <Tabs.Screen
                name="shop"
                options={{
                    title: "Boutique",
                    tabBarIcon: ({ focused }) => <TabIcon focused={focused} IconComponent={Entypo} iconName="shop" />,
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profil",
                    tabBarIcon: ({ focused }) => <TabIcon focused={focused} IconComponent={FontAwesome6} iconName="face-grin-wide" />,
                }}
            />
        </Tabs>
        </>
    );
}

const styles = StyleSheet.create({
    // Style du badge de points
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: "#F57C00",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    badgeText: {
        fontWeight: '900',
        color: '#E65100',
        fontSize: 14,
    },

    // Style des icônes de la barre de navigation
    iconWrapper: {
        borderRadius: 20,
        height: 46,
        width: 46,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 35,
    },
    iconWrapperActive: {
        backgroundColor: '#E8F5E9',
        transform: [{ translateY: -5 }], 
    }
});