import { useRouter } from 'expo-router';
import { Button, Text, View } from "react-native";

export default function Profile() {
  const router = useRouter();
  
  const logout = () => {
    router.replace('../../login'); 
  };

  return (
    <View>
      <Text>Profil</Text>
      <Button
        onPress={logout}
        title="Se déconnecter"
      />
    </View>
  );
}
