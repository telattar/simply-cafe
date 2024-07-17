import { Image, StyleSheet, Text, View } from "react-native";

export default function Error({ errorMessage }) {
  if (!errorMessage) {
    return null;
  }

  return (
    <View style={style.errorBox}>
      <Image source={require('../assets/error-mark.png')} style={style.errorIconSize} />
      <Text>
        {errorMessage}
      </Text>
    </View>
  )
}

const style = StyleSheet.create({
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F8C794',
    backgroundColor: '#F8C794',
    padding: 8,
    margin: 10,
    width: 350
  },
  errorIconSize: {
    height: 20,
    width: 20,
    marginRight: 10
  }
})