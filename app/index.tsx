import { Redirect } from 'expo-router';

export default function StartPage() {
  // Ajouter une fonction pour vérifier si le user est connecté pour l'envoyer directement sur la page d'accueil de l'app
  // Là, envoie sur le login
  return <Redirect href="/login" />;
}