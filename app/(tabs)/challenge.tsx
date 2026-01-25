import { Text, View, FlatList, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { database } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

//permet définir défis avec ces caractéristiques à chaque fois qu'on utilise
interface Defis {
  id:number;
  categorie:string[];
  co2:number;
  description: string;
  difficulte: number;
  image: string;
  nom: string;
  validation: boolean;
}

//stocker la liste de défis
const ListDefis = () => {
  const[]
}

export default function Challenge() {
  return (
    <View>
      <Text>Challenge</Text>
    </View>
  );
}
