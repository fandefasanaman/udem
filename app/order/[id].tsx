import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Order, OrderItem, Formation } from '@/types/database';
import { ArrowLeft, Download, CheckCircle, Clock, XCircle } from 'lucide-react-native';

type OrderWithItems = Order & {
  items: (OrderItem & { formation: Formation })[];
};

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOrder();
      const interval = setInterval(loadOrder, 5000);
      return () => clearInterval(interval);
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (orderError) throw orderError;
      if (!orderData) throw new Error('Commande introuvable');

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, formation:formations(*)')
        .eq('order_id', id);

      if (itemsError) throw itemsError;

      setOrder({ ...orderData, items: itemsData as any });
    } catch (error) {
      console.error('Error loading order:', error);
      Alert.alert('Erreur', 'Impossible de charger la commande');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (formationId: string) => {
    if (!user) return;

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-download-link`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            formation_id: formationId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur de téléchargement');
      }

      Alert.alert('Téléchargement', 'Le téléchargement va commencer', [
        { text: 'OK', onPress: () => console.log('Download URL:', result.url) },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de télécharger');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Commande introuvable</Text>
      </View>
    );
  }

  const getStatusIcon = () => {
    switch (order.statut) {
      case 'completed':
        return <CheckCircle color="#10B981" size={48} />;
      case 'pending':
        return <Clock color="#F59E0B" size={48} />;
      case 'failed':
        return <XCircle color="#EF4444" size={48} />;
      default:
        return <Clock color="#6B7280" size={48} />;
    }
  };

  const getStatusText = () => {
    switch (order.statut) {
      case 'completed':
        return 'Paiement confirmé';
      case 'pending':
        return 'En attente de paiement';
      case 'confirmed':
        return 'Paiement en cours';
      case 'failed':
        return 'Paiement échoué';
      default:
        return order.statut;
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
        <Text style={styles.headerTitle}>Commande</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statusCard}>
          {getStatusIcon()}
          <Text style={styles.statusText}>{getStatusText()}</Text>
          <Text style={styles.statusDate}>
            {new Date(order.date_creation).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Référence</Text>
            <Text style={styles.detailValue}>{order.id.substring(0, 8)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Méthode</Text>
            <Text style={styles.detailValue}>{order.methode_paiement}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Montant</Text>
            <Text style={styles.detailValue}>{order.montant_total.toLocaleString()} Ar</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Formations</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.formationCard}>
              <View style={styles.formationInfo}>
                <Text style={styles.formationName}>{item.formation.nom}</Text>
                <Text style={styles.formationPrice}>{item.prix.toLocaleString()} Ar</Text>
              </View>
              {order.statut === 'completed' && (
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => handleDownload(item.formation_id)}
                >
                  <Download color="#4F46E5" size={20} />
                  <Text style={styles.downloadText}>Télécharger</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
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
  statusCard: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    padding: 32,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  statusDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  formationCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  formationInfo: {
    marginBottom: 12,
  },
  formationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  formationPrice: {
    fontSize: 14,
    color: '#6B7280',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 8,
  },
  downloadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
});
