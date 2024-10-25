import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, Image  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');



  // Login Username = Admin + Passwort = Admin123
  const handleLogin = () => {
    if (username === 'Admin' && password === 'Admin123') {
      navigation.navigate('Bookmark');
    } else {
      Alert.alert('Fehler', 'Ungültige Anmeldedaten');
    }
  };

  return (
    <View className="flex-1 relative">
        <Image 
        blurRadius={70} 
        source={require('../assets/images/bg.png')}
        className="absolute w-full h-full" 
        />
        <SafeAreaView className="flex-1">
            <View style={styles.container}>
                <Text style={[styles.label, { color: 'white' }]}>Benutzername:</Text>
                <TextInput
                    value={username}
                    onChangeText={setUsername}
                    style={[styles.input, { color: 'white' }]}
                />
                <Text style={[styles.label, { color: 'white' }]}>Passwort:</Text>
                <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={[styles.input, { color: 'white' }]}
                />
                <Button title="Anmelden" onPress={handleLogin} />
            </View>
        </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    width: '100%',
    padding: 10,
    marginBottom: 10,
  },
});

export default LoginScreen;
