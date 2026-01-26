import { Redirect } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { auth } from "@/firebaseBD/firebaseConfig";

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
