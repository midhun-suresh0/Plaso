import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoButton } from '../components/PlasoButton';
import { theme } from '../constants/theme';
import { cartApi } from '../services/api/cartApi';
import { Cart, CartItem } from '../types/order';
import { RootStackParamList } from '../types';

type CartScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CartScreen() {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      const response = await cartApi.getCart();
      if (response.success && response.data) {
        setCart(response.data!.cart);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCart();
    });
    return unsubscribe;
  }, [navigation]);

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      return removeItem(itemId);
    }
    
    setUpdating(itemId);
    try {
      const response = await cartApi.updateItemQuantity(itemId, newQuantity);
      if (response.success && response.data) {
        setCart(response.data!.cart);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      const response = await cartApi.removeItem(itemId);
      if (response.success && response.data) {
        setCart(response.data!.cart);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  const calculateTotal = () => {
    if (!cart) return 0;
    return cart.items.reduce((total, item) => total + (item.listing.price * item.quantity), 0);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const isUpdating = updating === item.listing._id.toString();

    return (
      <View style={styles.itemCard}>
        <Image 
          source={{ uri: item.listing.images?.[0] || 'https://via.placeholder.com/100' }} 
          style={styles.itemImage} 
        />
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle} numberOfLines={2}>{item.listing.title}</Text>
          <Text style={styles.itemPrice}>₹{item.listing.price.toLocaleString('en-IN')}</Text>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityBtn} 
              onPress={() => updateQuantity(item.listing._id.toString(), item.quantity - 1)}
              disabled={isUpdating}
            >
              <Ionicons name="remove" size={16} color={theme.colors.text} />
            </TouchableOpacity>
            
            {isUpdating ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={styles.quantitySpinner} />
            ) : (
              <Text style={styles.quantityText}>{item.quantity}</Text>
            )}
            
            <TouchableOpacity 
              style={styles.quantityBtn}
              onPress={() => updateQuantity(item.listing._id.toString(), item.quantity + 1)}
              disabled={isUpdating}
            >
              <Ionicons name="add" size={16} color={theme.colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.removeBtn}
              onPress={() => removeItem(item.listing._id.toString())}
              disabled={isUpdating}
            >
              <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <PlasoScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </PlasoScreen>
    );
  }

  const hasItems = cart && cart.items.length > 0;

  return (
    <PlasoScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <View style={{ width: 28 }} />
      </View>

      {!hasItems ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <PlasoButton 
            title="Explore Marketplace" 
            onPress={() => navigation.navigate('Marketplace')}
            style={styles.exploreBtn}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={cart.items}
            keyExtractor={(item) => item.listing._id.toString()}
            renderItem={renderCartItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>₹{calculateTotal().toLocaleString('en-IN')}</Text>
            </View>
            <PlasoButton 
              title="Proceed to Checkout" 
              onPress={() => navigation.navigate('Checkout' as any)}
            />
          </View>
        </>
      )}
    </PlasoScreen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  listContainer: {
    padding: 20,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceHighlight,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  quantitySpinner: {
    marginHorizontal: 12,
    width: 20,
  },
  removeBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginTop: 16,
    marginBottom: 32,
  },
  exploreBtn: {
    width: '100%',
  },
  footer: {
    padding: 20,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    color: theme.colors.textSecondary,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
});
