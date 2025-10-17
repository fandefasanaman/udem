import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react-native';

type PaymentMethod = 'mvola' | 'orange_money';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, getTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mvola');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    setLoading(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          montant_total: getTotal(),
          statut: 'pending',
          methode_paiement: selectedMethod,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        formation_id: item.formation.id,
        prix: item.formation.prix,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/process-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: order.id,
            amount: getTotal(),
            payment_method: selectedMethod,
            phone: profile?.telephone,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur de paiement');
      }

      clearCart();

      Alert.alert(
        'Paiement en cours',
        'Veuillez compléter le paiement sur votre téléphone',
        [{ text: 'OK', onPress: () => router.replace(`/order/${order.id}`) }]
      );
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert('Erreur', error.message || 'Impossible de traiter le paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé de la commande</Text>
          {cart.map((item) => (
            <View key={item.formation.id} style={styles.item}>
              <Text style={styles.itemName}>{item.formation.nom}</Text>
              <Text style={styles.itemPrice}>{item.formation.prix.toLocaleString()} Ar</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{getTotal().toLocaleString()} Ar</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Méthode de paiement</Text>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedMethod === 'mvola' && styles.paymentOptionSelected,
            ]}
            onPress={() => setSelectedMethod('mvola')}
          >
            <View style={styles.radioOuter}>
              {selectedMethod === 'mvola' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>MVola</Text>
              <Text style={styles.paymentDescription}>Paiement via Vodacom</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedMethod === 'orange_money' && styles.paymentOptionSelected,
            ]}
            onPress={() => setSelectedMethod('orange_money')}
          >
            <View style={styles.radioOuter}>
              {selectedMethod === 'orange_money' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>Orange Money</Text>
              <Text style={styles.paymentDescription}>Paiement via Orange</Text>
            </View>
          </TouchableOpacity>
        </View>

        {profile?.telephone && (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Le paiement sera effectué depuis le numéro: {profile.telephone}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>
              Payer {getTotal().toLocaleString()} Ar
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  itemName: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentOptionSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  paymentDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoCard: {
    backgroundColor: '#DBEAFE',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
