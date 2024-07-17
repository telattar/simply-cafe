import axios from 'axios';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Alert, Button, TouchableOpacity, Image, Dimensions } from 'react-native';
import Error from './components/errorPop.js';

export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loginRequest = async () => {
    try {
      const response = await axios.post('http://192.168.0.102:3000/login', {
        username,
        password
      });
      console.log("hi")
      console.log(response.data.userType);
    } catch (error) {
      setErrorMsg(error.response.data.message);
    }
  };

  return (
    <View style={styles.container}>

      <Error errorMessage={errorMsg} />

      <Text style={styles.logoText}>
        Simply Cafe
        <Image source={require('./assets/coffee-cup.png')} style={styles.img} />
      </Text>

      <TextInput
        style={styles.textinput}
        placeholder='username'
        onChangeText={(val) => setUsername(val)}
      />
      <TextInput
        style={styles.textinput}
        secureTextEntry={true}
        placeholder='password'
        onChangeText={(val) => setPassword(val)}
      />

      <TouchableOpacity
        style={buttonStyles.buttonStyle}
        onPress={loginRequest}
      >
        <Text style={buttonStyles.buttonText}>Login</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF2D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textinput: {
    borderWidth: 1,
    borderColor: '#777',
    padding: 8,
    margin: 10,
    width: 250
  },
  img: {
    width: 40,
    height: 40,
  },
  logoText: {
    fontSize: 30,
    fontWeight: 'bold',
    fontFamily: 'sans-serif'
  }
});

const buttonStyles = StyleSheet.create({
  buttonStyle: {
    borderWidth: 1,
    width: 100,
    backgroundColor: '#F8C794',
    padding: 4,
    borderRadius: 6,
    borderColor: '#F8C794',
    alignItems: 'center'
  },
  buttonText: {
    color: 'brown',
    fontWeight: 'bold'
  },
})
