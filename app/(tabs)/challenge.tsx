import { Text, View, FlatList, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { database } from "../firebaseConfig";
import { collection, getDocs, onSnapshot, snapshotEqual } from "firebase/firestore";

//permet définir défis avec ces caractéristiques à chaque fois qu'on utilise
interface Defi {
  id:string;
  categorie:string[];
  co2:number;
  description: string;
  difficulte: number;
  image: string;
  nom: string;
  validation: boolean;
}


export default function ListDefis() {
  //stocker la liste de défis (const[variableAffichable, valeurQuiChange]=useState(valeurInitiale))
  const[defis, setDefis] = useState<Defi[]>([])
  const[chargement, setChargement] = useState(true);

  useEffect(() => {
    const fetchDefi = async () => {
      try {
        //utilisation de snapshot pour mettre à jour automatiquement après ajout d'un document sur Firestore sans rafraîchir la page
        const recup = onSnapshot(collection(database, "Défis"), (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setDefis(data as Defi[])
        })
        return () => recup();
      } catch(error){
        console.error("Ne peut pas lire dans la base de données , ", error)
      } finally {
        setChargement(false)
      }
    } 
  })

  if(chargement) return <Text> Chargement des défis... </Text>

  return (
    <View>
      <FlatList
        data={defis}
        keyExtractor={(item)=>item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.nom}</Text>
            <Text>{item.description}</Text>
          </View>
        )}
      />
    </View>
  );
}
