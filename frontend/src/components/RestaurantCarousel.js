import React, { useState, useRef, useEffect } from 'react';
import { FlatList, Dimensions, StyleSheet, View, Animated, TouchableOpacity, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MediumText, BoldText, ThemedView, RegularText, SemiBoldText } from '../components/StyledComponents';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.8;
const ITEM_SPACING = -10;
const SPACER_ITEM_SIZE = (width - ITEM_WIDTH) / 6;

const RestaurantCarousel = ({ 
  restaurants = [], 
  title = "Our Partners",
  autoPlay = true,
  autoPlayInterval = 3000,
  onRestaurantPress
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const flatlistRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  
  const getItemLayout = (_, index) => ({
    length: ITEM_WIDTH,
    offset: ITEM_WIDTH * index,
    index,
  });

  const renderData = () => {
    return restaurants;
  };

  useEffect(() => {
    let interval;
  
    if (autoPlay && restaurants.length > 1) {
      interval = setInterval(() => {
        const nextIndex = (activeIndex + 1) % restaurants.length;
        
        flatlistRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
  
        setActiveIndex(nextIndex);
      }, autoPlayInterval);
    }
  
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeIndex, autoPlay, restaurants.length, autoPlayInterval]);


  const handleRestaurantPress = (restaurant) => {
    if (restaurant.spacer) return; 
    
    if (onRestaurantPress) {
      onRestaurantPress(restaurant);
    } else {
      navigation.navigate('RestaurantDetail', { restaurantId: restaurant._id });
    }
  };


  const renderRestaurantItem = ({ item, index }) => {
    
    const inputRange = [
        (index - 1) * ITEM_WIDTH,
        index * ITEM_WIDTH,
        (index + 1) * ITEM_WIDTH,
      ];
    
    
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });
    
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleRestaurantPress(item)}
      >
        <Animated.View
          style={[
            styles.restaurantCard,
            {
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          <ImageBackground 
            source={require('../../assets/images/placeholder-bg.jpg')}
            style={styles.imageBackground}
            imageStyle={{ borderRadius: 16 }}
          >
            {/* Dark overlay for text readability */}
            <View style={styles.gradientOverlay}>
              <View style={styles.textOverlay}>
                <BoldText style={styles.restaurantName}>
                  {item.name}
                </BoldText>
                
                <RegularText style={styles.restaurantAddress}>
                  {item.location.address}, {item.location.city}
                </RegularText>

                <MediumText numberOfLines={2} style={styles.description}>
                  {item.description}
                </MediumText>
              </View>
            </View>
          </ImageBackground>
        </Animated.View>
      </TouchableOpacity>
    );
  };


  const renderPaginationDots = () => {
    return (
      <View style={styles.paginationContainer}>
        {restaurants.map((_, index) => {
          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: theme.primary,
                  opacity: scrollX.interpolate({
                    inputRange: [
                        (index) * ITEM_WIDTH - ITEM_WIDTH,  
                        (index) * ITEM_WIDTH,             
                        (index) * ITEM_WIDTH + ITEM_WIDTH   
                      ],
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                  }),
                  width: scrollX.interpolate({
                    inputRange: [
                      (index - 1) * ITEM_WIDTH,
                      index * ITEM_WIDTH,       
                      (index + 1) * ITEM_WIDTH  
                    ],
                    outputRange: [8, 16, 8], 
                    extrapolate: 'clamp',
                  }),
                  
                },
              ]}
            />
          );
        })}
      </View>
    );
  };
  
  const handleOnScroll = (event) => {
  
    const scrollPosition = event.nativeEvent.contentOffset.x;

    Animated.event(
      [{ nativeEvent: { contentOffset: { x: scrollX } } }],
      { useNativeDriver: false }
    )(event);

    const newIndex = Math.round(scrollPosition / ITEM_WIDTH);
  };

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && !viewableItems[0].item.spacer) {

      const adjustedIndex = viewableItems[0].index - 1;
      if (adjustedIndex >= 0) {
        setActiveIndex(adjustedIndex);
      }
    }
  }).current;

  const handleMomentumScrollEnd = (event) => {

    const newIndex = Math.round(event.nativeEvent.contentOffset.x / ITEM_WIDTH) - 1;
    if (newIndex >= 0 && newIndex < restaurants.length) {
      setActiveIndex(newIndex);
    }
  };

  const data = renderData();

  return (
    <View style={styles.container}>
      <SemiBoldText style={[styles.title, { color: theme.text }]}>
        {title}
      </SemiBoldText>
      
      <FlatList
        ref={flatlistRef}
        data={data}
        keyExtractor={(item, index) => item._id?.toString() || `item-${index}`}
        renderItem={renderRestaurantItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={[
            styles.listContent, 
            { paddingHorizontal: (width - ITEM_WIDTH) / 2 }
          ]}
        onScroll={handleOnScroll}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
        initialScrollIndex={0} 
      />
      
      {restaurants.length > 1 && renderPaginationDots()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 18,
    marginBottom: 12,
  },
  listContent: {
    paddingVertical: 10,
  },
  restaurantCard: {
    width: ITEM_WIDTH,
    height: 220,
    marginHorizontal: ITEM_SPACING / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
    backgroundColor: 'rgba(0,0,0,0.7)', 
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  textOverlay: {
    padding: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  restaurantName: {
    fontSize: 20,
    marginBottom: 4,
    color: '#FFFFFF',
  },
  restaurantAddress: {
    fontSize: 14,
    marginBottom: 8,
    color: '#EEEEEE',
  },
  description: {
    fontSize: 14,
    color: '#DDDDDD',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default RestaurantCarousel;