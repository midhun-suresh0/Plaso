import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoButton } from '../components/PlasoButton';
import { theme } from '../constants/theme';

export default function OrderSuccessScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const { orderId } = route.params;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' as any }],
      });
    }, 4000); // Wait 4 seconds then redirect to Home

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <PlasoScreen>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={100} color={theme.colors.success} />
        </View>
        
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>Your order has been placed and is being processed.</Text>
        
        <View style={styles.invoiceCard}>
          <Text style={styles.invoiceTitle}>Invoice / Receipt</Text>
          <Text style={styles.invoiceText}>Order ID: {orderId}</Text>
          <Text style={styles.invoiceText}>Status: Paid</Text>
          <Text style={styles.invoiceNote}>A detailed receipt has been saved to your account.</Text>
        </View>

        <PlasoButton 
          title="View Order Details" 
          onPress={() => navigation.navigate('OrderDetails', { orderId })}
          style={styles.btn}
        />
        
        <TouchableOpacity onPress={() => navigation.navigate('Marketplace')} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </PlasoScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  invoiceCard: {
    backgroundColor: theme.colors.surfaceHighlight,
    padding: 24,
    borderRadius: 16,
    width: '100%',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  invoiceText: {
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 8,
  },
  invoiceNote: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 16,
    fontStyle: 'italic',
  },
  btn: {
    width: '100%',
    marginBottom: 16,
  },
  secondaryBtn: {
    padding: 16,
  },
  secondaryBtnText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  }
});
