import { View, TextInput, TouchableOpacity, Text, Image, FlatList } from 'react-native';
import React, { useCallback, useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { XMarkIcon } from 'react-native-heroicons/outline';
import { MapPinIcon, RefreshIcon } from 'react-native-heroicons/solid'
import { debounce } from "lodash";
import { theme } from '../theme';
import { fetchLocations } from '../api/weather';
import { getData, storeData } from '../utils/asyncStorage';

export default function SearchScreen({ navigation }) { 
  const [showSearch, toggleSearch] = useState(true);
  const [locations, setLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarks, setBookmarks] = useState([]);

  // Funktion zum Abrufen von Lesezeichen
  const loadBookmarks = async () => {
    const storedBookmarks = await getData('bookmarks');
    if (storedBookmarks) {
      setBookmarks(storedBookmarks);
    }
  };
  
  useEffect(() => {
    loadBookmarks(); // Lesezeichen beim Laden des Screens abrufen
  }, []);

    // Funktion zum Aktualisieren der Lesezeichen
    const refreshBookmarks = () => {
      loadBookmarks(); // Lesezeichen erneut laden
    };

  // Funktion für das Entfernen eines Lesezeichens
  const removeBookmark = async (locationToRemove) => {
    const updatedBookmarks = bookmarks.filter(loc => loc.name !== locationToRemove.name);
    setBookmarks(updatedBookmarks);
    await storeData('bookmarks', updatedBookmarks); // Aktualisierte Lesezeichen in AsyncStorage speichern
  };



  const handleSearch = search=>{
    if(search && search.length>2)
      fetchLocations({cityName: search}).then(data=>{
        setLocations(data);
      })
  }

  const clearSearch = () => {
    setSearchQuery("");
    setLocations([]);
  };

    // Funktion zum Navigieren zum HomeScreen und Übergeben der Location
    const handleLocation = (loc) => {
      navigation.navigate('Home', { location: loc });
    };

  const handleTextDebounce = useCallback(debounce(handleSearch, 1200), []);


  return (
    <View className="flex-1 relative">
      <Image 
        blurRadius={70} 
        source={require('../assets/images/bg.png')}
        className="absolute w-full h-full" 
      />

      <SafeAreaView className="flex-1">
        {/* Search Bar */}
        <View style={{height: '7%'}} className="mx-4 relative z-50">
          <View 
            className="flex-row justify-end items-center rounded-full" 
            style={{backgroundColor: theme.bgWhite(0.2)}}>
            
            <TextInput 
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  handleTextDebounce(text);
                }} 
                placeholder="Search city" 
                placeholderTextColor={'lightgray'} 
                className="pl-6 h-10 pb-1 flex-1 text-base text-black" 
              />
              <TouchableOpacity 
                onPress={clearSearch}
                className="rounded-full p-3 m-1" 
                style={{backgroundColor: theme.bgWhite(0.3)}}>
                  <XMarkIcon size="25" color="black" />
              </TouchableOpacity>
          </View>

          {locations.length > 0 ? (
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

        {/* Bookmarks List + Icon noch ersetzten */}
        <View className="flex-1 mx-4 mt-4">
          <View className="flex-row items-center">
            <Text className="text-white text-xl">Lesezeichen</Text>
            <TouchableOpacity onPress={refreshBookmarks} className="ml-2">
              <Text className="text-white text-2xl ml-52">↻</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={bookmarks}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleLocation(item)}
                className="flex-row items-center p-3 border-b border-gray-400">
                <MapPinIcon size="20" color="gray" />
                <Text className="text-white text-lg ml-2">{item?.name}, {item?.country}</Text>
                <TouchableOpacity onPress={() => removeBookmark(item)} className="ml-auto">
                  <Text className="text-red-500">Entfernen</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.name}
          />
        </View>


      </SafeAreaView>
    </View>
  );
}
