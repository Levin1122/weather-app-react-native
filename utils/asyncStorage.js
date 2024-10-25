import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value)); //JSON.stringify hinzugefügt
  } catch (error) {
    console.log('Error storing value: ', error);
  }
};


export const getData = async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ?  JSON.parse(value) : null; //JSON.stringify : null hinzugefügt
    } catch (error) {
      console.log('Error retrieving value: ', error);
    }
};