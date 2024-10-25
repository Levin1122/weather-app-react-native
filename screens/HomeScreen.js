import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { MagnifyingGlassIcon, XMarkIcon, BackspaceIcon  } from 'react-native-heroicons/outline'
import { CalendarDaysIcon, MapPinIcon } from 'react-native-heroicons/solid'
import { debounce } from "lodash";
import { theme } from '../theme';
import { fetchLocations, fetchWeatherForecast } from '../api/weather';
import * as Progress from 'react-native-progress';
import { StatusBar } from 'expo-status-bar';
import { weatherImages } from '../constants';
import { getData, storeData } from '../utils/asyncStorage';

//Schüttelsensor + Location
import { Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';


//useState
export default function HomeScreen({ route, navigation }) {
  const locationFromBookmarks = route.params?.location;

  const [showSearch, toggleSearch] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState({});
  const [bookmarks, setBookmarks] = useState([]);

  


  // Funktion zur Suche von Städten
  const handleSearch = search => {
    if(search && search.length>2)
      fetchLocations({cityName: search}).then(data=>{
        setLocations(data);
      })
  }

  // Wenn eine Stadt ausgewählt wird, lade die Wetterdaten
  const handleLocation = loc=>{
    setLoading(true);
    toggleSearch(false);
    setLocations([]);
    fetchWeatherForecast({
      cityName: loc.name,
      days: '7'
    }).then(data=>{
      setLoading(false);
      setWeather(data);
      storeData('city',loc.name);
    })
  }

  // Initiale Wetterdaten laden oder wenn eine Stadt aus dem BookmarkScreen ausgewählt wurde
  useEffect(()=>{
    fetchMyWeatherData();
  },[locationFromBookmarks]);

  //Sensor (Schüttel + Geolocation Sensor)
  useEffect(() => {
    const getLocationPermission = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Zugriffsfehler', 'Standortberechtigung wird benötigt, um die Geodaten abzurufen.');
        return false;
      }
      return true;
    };
  
    const fetchLocationAndShowAlert = async () => {
      const permissionGranted = await getLocationPermission();
      if (!permissionGranted) return;
  
      try {
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
  
        Alert.alert(
          'Aktuelle Informationen',
          `🌡️ Temperatur: ${weather?.current?.temp_c} °C\n` +
          `📍 Standort:\n` +
          `Breitengrad: ${latitude.toFixed(6)}\n` +
          `Längengrad: ${longitude.toFixed(6)}`,
        );
      } catch (error) {
        console.error(error);
        Alert.alert('Fehler', 'Standort konnte nicht abgerufen werden.');
      }
    };
  
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const shakeThreshold = 1.5;
      const shakeMagnitude = Math.sqrt(x * x + y * y + z * z);
  
      if (shakeMagnitude > shakeThreshold) {
        fetchLocationAndShowAlert();
      }
    });
  
    Accelerometer.setUpdateInterval(100);
  
    return () => {
      subscription.remove();
      Accelerometer.setUpdateInterval(1000);
    };
  }, [weather]);
  

  const fetchMyWeatherData = async ()=>{
    let cityName = locationFromBookmarks?.name || await getData('city') || 'Islamabad';

    fetchWeatherForecast({
      cityName,
      days: '7'
    }).then(data=>{
      setWeather(data);
      setLoading(false);
    })
    
  }

  const handleTextDebounce = useCallback(debounce(handleSearch, 1200), []);



  // Funktion zum Hinzufügen von Lesezeichen
  const addBookmark = async () => {
    const currentLocation = weather?.location;

    if (currentLocation) {
      const newBookmark = currentLocation;

      // Verhindern, dass doppelte Einträge hinzugefügt werden für den BookmarkScreen
      const existingBookmarks = await getData('bookmarks') || [];
      if (!existingBookmarks.some(bookmark => bookmark.name === newBookmark.name)) {
        const updatedBookmarks = [...existingBookmarks, newBookmark];
        await storeData('bookmarks', updatedBookmarks);
        setBookmarks(updatedBookmarks);
        console.log(`Lesezeichen hinzugefügt: ${newBookmark.name}`);


      } else {
        console.log(`Lesezeichen bereits vorhanden: ${newBookmark.name}`);
      }
    }
  };

  return (
    <View className="flex-1 relative">
      <StatusBar style="light" />
      {/* Hintergrund Bild */}
      <Image 
        blurRadius={70} 
        source={require('../assets/images/bg.png')} 
        className="absolute w-full h-full" />

      {/* Zurück Button */}
      {!showSearch && (
        <TouchableOpacity 
          onPress={() => {
            navigation.goBack();
          }}
          className="absolute top-11 left-4 p-2 rounded-full"
          style={{ zIndex: 10, backgroundColor: 'transparent' }}
        >
          <BackspaceIcon size="30" color="white" />
        </TouchableOpacity>
      )}

      {/* Lesezeichen Hinzufügen Button */}
      {!showSearch && (
        <TouchableOpacity
          onPress={addBookmark}
          className="absolute top-12 right-28 p-2 rounded-full border border-white"
          style={{ zIndex: 10 }}
        >
          <Text className="text-white font-semibold">Lesezeichen hinzufügen</Text>
        </TouchableOpacity>
      )}

        {
          loading? (
            <View className="flex-1 flex-row justify-center items-center">
              <Progress.CircleSnail thickness={10} size={140} color="#0bb3b2" />
            </View>
          ):(
            <SafeAreaView className="flex flex-1">
              {/* search Bar */}
              <View style={{height: '7%'}} className="mx-4 relative z-50">
                <View 
                  className="flex-row justify-end items-center rounded-full" 
                  style={{backgroundColor: showSearch? theme.bgWhite(0.2): 'transparent'}}>
                  
                    {
                      showSearch? (
                        <TextInput 
                          onChangeText={handleTextDebounce} 
                          placeholder="Search city" 
                          placeholderTextColor={'lightgray'} 
                          className="pl-6 h-10 pb-1 flex-1 text-base text-white" 
                        />
                      ):null
                    }
                    <TouchableOpacity 
                      onPress={()=> toggleSearch(!showSearch)} 
                      className="rounded-full p-3 m-1" 
                      style={{backgroundColor: theme.bgWhite(0.3)}}>
                      {
                        showSearch? (
                          <XMarkIcon size="25" color="white" />
                        ):(
                          <MagnifyingGlassIcon size="25" color="white" />
                        )
                      }  
                    </TouchableOpacity>
                </View>
                {
                  locations.length>0 && showSearch?(
                    <View className="absolute w-full bg-gray-300 top-16 rounded-3xl ">
                      {
                        locations.map((loc, index)=>{
                          let showBorder = index+1 != locations.length;
                          let borderClass = showBorder? ' border-b-2 border-b-gray-400':'';
                          return (
                            <TouchableOpacity 
                              key={index}
                              onPress={()=> handleLocation(loc)} 
                              className={"flex-row items-center border-0 p-3 px-4 mb-1 "+borderClass}>
                                <MapPinIcon size="20" color="gray" />
                                <Text className="text-black text-lg ml-2">{loc?.name}, {loc?.country}</Text>
                            </TouchableOpacity>
                          )
                        })
                      }
                    </View>
                  ):null
                }
              </View>

              {/* Prognoseabschnitt */}
              <View className="mx-4 flex justify-around flex-1 mb-2">
                {/* location */}
                <Text className="text-white text-center text-2xl font-bold">
                  {weather?.location?.name},{" "}
                  <Text className="text-lg font-semibold text-gray-300">
                    {weather?.location?.country}
                  </Text>
                </Text>
                {/* Wetter icon */}
                <View className="flex-row justify-center">
                  <Image 
                    source={weatherImages[weather?.current?.condition?.text || 'other']}  
                    className="w-52 h-52" />
                </View>
                {/* celcius */}
                <View className="space-y-2">
                    <Text className="text-center font-bold text-white text-4xl ml-3">
                      {weather?.current?.temp_c}&#176;
                    </Text>
                    <Text className="text-center text-white text-xl tracking-widest">
                      {weather?.current?.condition?.text}
                    </Text>
                </View>

                {/* andere Statistiken */}
                <View className="flex-row justify-between mx-4">
                  <View className="flex-row space-x-2 items-center">
                    <Image source={require('../assets/icons/wind.png')} className="w-6 h-6" />
                    <Text className="text-white font-semibold text-base">{weather?.current?.wind_kph}km</Text>
                  </View>
                  <View className="flex-row space-x-2 items-center">
                    <Image source={require('../assets/icons/drop.png')} className="w-6 h-6" />
                    <Text className="text-white font-semibold text-base">{weather?.current?.humidity}%</Text>
                  </View>
                  <View className="flex-row space-x-2 items-center">
                    <Image source={require('../assets/icons/sun.png')} className="w-6 h-6" />
                    <Text className="text-white font-semibold text-base">
                      { weather?.forecast?.forecastday[0]?.astro?.sunrise }
                    </Text>
                  </View>
                  
                </View>
              </View>

              {/* Prognose für die nächsten Tage */}
              <View className="mb-2 space-y-3">
                <View className="flex-row items-center mx-5 space-x-2">
                  <CalendarDaysIcon size="22" color="white" />
                  <Text className="text-white text-base">Tägliche Vorhersage</Text>
                </View>
                <ScrollView   
                  horizontal
                  contentContainerStyle={{paddingHorizontal: 15}}
                  showsHorizontalScrollIndicator={false}
                >
                  {
                    weather?.forecast?.forecastday?.map((item,index)=>{
                      const date = new Date(item.date);
                      const options = { weekday: 'long' };
                      let dayName = date.toLocaleDateString('en-US', options);
                      dayName = dayName.split(',')[0];

                      return (
                        <View 
                          key={index} 
                          className="flex justify-center items-center w-24 rounded-3xl py-3 space-y-1 mr-4" 
                          style={{backgroundColor: theme.bgWhite(0.15)}}
                        >
                          <Image 
                            source={weatherImages[item?.day?.condition?.text || 'other']}
                              className="w-11 h-11" 
                          />
                          <Text className="text-white">{dayName}</Text>
                          <Text className="text-white text-xl font-semibold">
                            {item?.day?.avgtemp_c}&#176;
                          </Text>
                        </View>
                      )
                    })
                  }
                </ScrollView>
              </View>
            </SafeAreaView>
          )
        }
    </View>
  )
}
