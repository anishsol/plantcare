import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Platform,
  FlatList,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { GoogleGenerativeAI } from '@google/generative-ai';

const { width, height } = Dimensions.get('window');

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI('AIzaSyD6mG3E64lfa6fbxUI4wvRbWONq_4x0WhU'); // Replace with your API key
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CATEGORIES = {
  BASIC_CARE: 'Basic Care & Introduction',
  GROWTH: 'Growth & Development',
  SOIL: 'Soil & Nutrients',
  WATER: 'Water Requirements',
  LIGHT: 'Light Requirements',
  PROBLEMS: 'Common Problems',
  REMEDIES: 'Home Remedies',
  MAINTENANCE: 'Maintenance Tips',
  SEASONAL: 'Seasonal Care',
  GARDENING: 'Advanced Gardening',
};

// API Integration
const fetchPlantTips = async (plantName) => {
  const prompt = `Generate a comprehensive plant care guide for ${plantName} with exactly 150 numbered points. 
  Structure the information as follows:

  1-15: Basic Care & Introduction
  - Species overview
  - General characteristics
  - Basic requirements
  - Climate preferences
  - Growth patterns

  16-35: Growth & Development
  - Growth stages
  - Size expectations
  - Development timeline
  - Structural characteristics
  - Growth patterns

  36-55: Soil & Nutrients
  - Soil composition
  - pH requirements
  - Fertilization schedule
  - Nutrient needs
  - Soil amendments

  56-75: Water Requirements
  - Watering frequency
  - Water quality
  - Drainage needs
  - Humidity requirements
  - Seasonal adjustments

  76-95: Light Requirements
  - Light intensity
  - Duration
  - Seasonal changes
  - Positioning
  - Shade requirements

  96-115: Common Problems
  - Pest identification
  - Disease symptoms
  - Environmental issues
  - Growth problems
  - Prevention methods

  116-125: Home Remedies
  - Natural solutions
  - DIY treatments
  - Organic approaches
  - Prevention methods
  - Emergency care

  126-135: Maintenance Tips
  - Pruning techniques
  - Cleaning methods
  - Tool requirements
  - Regular care
  - Maintenance schedule

  136-145: Seasonal Care
  - Season-specific needs
  - Temperature adjustments
  - Care modifications
  - Protection methods
  - Seasonal transitions

  146-150: Advanced Gardening
  - Propagation methods
  - Special techniques
  - Expert tips
  - Advanced care
  - Professional advice

  Format each point as a clear, detailed sentence. Number each point from 1 to 150 consecutively.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    return processTips(content);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};

// Function to fetch plant images from Pixabay
const fetchPlantImages = async (plantName) => {
  const PIXABAY_API_KEY = '47071155-2491a5c177f7b439e46a8aaad'; // Replace with your Pixabay API key
  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
        plantName + ' plant'
      )}&image_type=photo&per_page=10`
    );
    const data = await response.json();
    return data.hits.map((image) => ({
      id: image.id.toString(),
      url: image.webformatURL,
      large: image.largeImageURL,
    }));
  } catch (error) {
    console.error('Image API Error:', error);
    return [];
  }
};

const processTips = (content) => {
  // Split content by numbered points (1. 2. 3. etc)
  const points = content
    .split(/\d+\./)
    .filter((point) => point.trim())
    .map((point, index) => ({
      id: index + 1,
      content: point.trim(),
      category: getCategoryForIndex(index + 1),
    }));

  // Ensure we have exactly 150 points
  if (points.length !== 150) {
    console.warn(`Expected 150 points, got ${points.length}`);
  }

  return points;
};

const getCategoryForIndex = (index) => {
  if (index <= 15) return CATEGORIES.BASIC_CARE;
  if (index <= 35) return CATEGORIES.GROWTH;
  if (index <= 55) return CATEGORIES.SOIL;
  if (index <= 75) return CATEGORIES.WATER;
  if (index <= 95) return CATEGORIES.LIGHT;
  if (index <= 115) return CATEGORIES.PROBLEMS;
  if (index <= 125) return CATEGORIES.REMEDIES;
  if (index <= 135) return CATEGORIES.MAINTENANCE;
  if (index <= 145) return CATEGORIES.SEASONAL;
  return CATEGORIES.GARDENING;
};
const PlantCareScreen = () => {
  const [plantName, setPlantName] = useState('');
  const [plantInfo, setPlantInfo] = useState([]);
  const [plantImages, setPlantImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTip, setSelectedTip] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const listRef = useRef(null);

  const handleSearch = async () => {
    if (!plantName.trim()) {
      setError('Please enter a plant name');
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedTip(null);
    setSelectedCategory(null);
    setPlantImages([]);

    try {
      const [tips, images] = await Promise.all([
        fetchPlantTips(plantName),
        fetchPlantImages(plantName),
      ]);

      setPlantInfo(tips);
      setPlantImages(images);

      if (listRef.current) {
        listRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    } catch (err) {
      setError('Failed to fetch plant information. Please try again.');
      console.error('Search error:', err);
      setPlantInfo([]);
    } finally {
      setLoading(false);
    }
  };

  // Image Gallery Component
  const ImageGallery = React.memo(() => (
    <View style={styles.imageGalleryContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.imageGallery}>
        {plantImages.map((image) => (
          <TouchableOpacity
            key={image.id}
            onPress={() => setSelectedImage(image)}
            style={styles.imageContainer}>
            <Image
              source={{ uri: image.url }}
              style={styles.plantImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  ));

  // Category Filter Component
  const CategoryFilter = React.memo(() => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryFilterContainer}
      contentContainerStyle={styles.categoryFilterContent}>
      {Object.values(CATEGORIES).map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryChip,
            selectedCategory === category && styles.categoryChipSelected,
          ]}
          onPress={() =>
            setSelectedCategory(category === selectedCategory ? null : category)
          }>
          <FontAwesome5
            name={getCategoryIcon(category)}
            size={16}
            color={selectedCategory === category ? '#FFF' : '#2E7D32'}
          />
          <Text
            style={[
              styles.categoryChipText,
              selectedCategory === category && styles.categoryChipTextSelected,
            ]}>
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  ));

  // Tip Card Component
  const TipCard = React.memo(({ tip }) => (
    <TouchableOpacity
      style={[
        styles.tipCard,
        { backgroundColor: getCategoryColor(tip.category) },
      ]}
      onPress={() => setSelectedTip(tip)}
      activeOpacity={0.7}>
      <View style={styles.tipCardHeader}>
        <View style={styles.categoryContainer}>
          <FontAwesome5
            name={getCategoryIcon(tip.category)}
            size={16}
            color="#FFF"
          />
          <Text style={styles.tipCategory}>{tip.category}</Text>
        </View>
        <Text style={styles.tipNumber}>#{tip.id}</Text>
      </View>
      <Text style={styles.tipContent} numberOfLines={3}>
        {tip.content}
      </Text>
    </TouchableOpacity>
  ));

  // Detail Modal Component
  const DetailModal = React.memo(({ tip, visible, onClose }) => (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={[
              getCategoryColor(tip.category),
              darkenColor(getCategoryColor(tip.category), 0.2),
            ]}
            style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <FontAwesome5
                name={getCategoryIcon(tip.category)}
                size={24}
                color="#FFF"
              />
              <Text style={styles.modalCategory}>{tip.category}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome5 name="times" size={24} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView
            style={styles.modalScroll}
            showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <Text style={styles.tipNumberLarge}>Tip #{tip.id}</Text>
              <Text style={styles.tipContentLarge}>{tip.content}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  ));

  // Image Preview Modal
  const ImagePreviewModal = React.memo(({ image, visible, onClose }) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.imagePreviewContainer}
        activeOpacity={1}
        onPress={onClose}>
        <Image
          source={{ uri: image?.large }}
          style={styles.imagePreviewContent}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.imagePreviewClose} onPress={onClose}>
          <FontAwesome5 name="times-circle" size={30} color="#FFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  ));

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#E8F5E9', '#C8E6C9', '#A5D6A7']}
        style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Plant Care Guide</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter plant name (e.g., Monstera)"
              value={plantName}
              onChangeText={setPlantName}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCapitalize="words"
            />
            <TouchableOpacity
              style={[
                styles.searchButton,
                { opacity: plantName.trim() ? 1 : 0.7 },
              ]}
              onPress={handleSearch}
              disabled={!plantName.trim() || loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <FontAwesome5 name="search" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {plantImages.length > 0 && <ImageGallery />}
        {plantInfo.length > 0 && <CategoryFilter />}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>
              Finding care tips for {plantName}...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <FontAwesome5 name="exclamation-circle" size={50} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={
              selectedCategory
                ? plantInfo.filter((tip) => tip.category === selectedCategory)
                : plantInfo
            }
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <TipCard tip={item} />}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        {selectedTip && (
          <DetailModal
            tip={selectedTip}
            visible={!!selectedTip}
            onClose={() => setSelectedTip(null)}
          />
        )}

        {selectedImage && (
          <ImagePreviewModal
            image={selectedImage}
            visible={!!selectedImage}
            onClose={() => setSelectedImage(null)}
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#333',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchButton: {
    height: 50,
    width: 50,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGalleryContainer: {
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 10,
  },
  imageGallery: {
    paddingHorizontal: 16,
    gap: 10,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  plantImage: {
    width: '100%',
    height: '100%',
  },
  imagePreviewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewContent: {
    width: width,
    height: height * 0.7,
  },
  imagePreviewClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
  },
  categoryFilterContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 12,
    marginBottom: 8,
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  categoryChipSelected: {
    backgroundColor: '#2E7D32',
  },
  categoryChipText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  categoryChipTextSelected: {
    color: '#FFF',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  tipCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  tipCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipCategory: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tipContent: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCategory: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
  },
  modalScroll: {
    flex: 1,
  },
  modalBody: {
    padding: 16,
  },
  tipNumberLarge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tipContentLarge: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2E7D32',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
});

// Utility functions
const getCategoryIcon = (category) => {
  const icons = {
    [CATEGORIES.BASIC_CARE]: 'seedling',
    [CATEGORIES.GROWTH]: 'chart-line',
    [CATEGORIES.SOIL]: 'mountain',
    [CATEGORIES.WATER]: 'tint',
    [CATEGORIES.LIGHT]: 'sun',
    [CATEGORIES.PROBLEMS]: 'exclamation-triangle',
    [CATEGORIES.REMEDIES]: 'mortar-pestle',
    [CATEGORIES.MAINTENANCE]: 'cut',
    [CATEGORIES.SEASONAL]: 'calendar-alt',
    [CATEGORIES.GARDENING]: 'tools',
  };
  return icons[category] || 'leaf';
};

const getCategoryColor = (category) => {
  const colors = {
    [CATEGORIES.BASIC_CARE]: '#4CAF50',
    [CATEGORIES.GROWTH]: '#2196F3',
    [CATEGORIES.SOIL]: '#8D6E63',
    [CATEGORIES.WATER]: '#00BCD4',
    [CATEGORIES.LIGHT]: '#FFA000',
    [CATEGORIES.PROBLEMS]: '#F44336',
    [CATEGORIES.REMEDIES]: '#9C27B0',
    [CATEGORIES.MAINTENANCE]: '#009688',
    [CATEGORIES.SEASONAL]: '#FF5722',
    [CATEGORIES.GARDENING]: '#3F51B5',
  };
  return colors[category] || '#757575';
};

const darkenColor = (hex, factor) => {
  // Remove the hash at the start if it's there
  hex = hex.replace(/^#/, '');

  // Parse the hex values
  let r = parseInt(hex.slice(0, 2), 16);
  let g = parseInt(hex.slice(2, 4), 16);
  let b = parseInt(hex.slice(4, 6), 16);

  // Darken each component
  r = Math.round(r * (1 - factor));
  g = Math.round(g * (1 - factor));
  b = Math.round(b * (1 - factor));

  // Convert back to hex
  const darkHex = `#${r.toString(16).padStart(2, '0')}${g
    .toString(16)
    .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  return darkHex;
};

export default PlantCareScreen;
