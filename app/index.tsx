import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseBD/firebaseConfig"; // ajuste le chemin si besoin

export default function StartPage() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setIsReady(true);
    });

    return unsubscribe;
  }, []);

  // Tant qu'on ne sait pas encore, on n'affiche rien (évite un flash login)
  if (!isReady) return null;

  return isLoggedIn ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}
