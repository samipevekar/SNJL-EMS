import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import colors from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { deleteStockIncrement, selectDeleteStockError, selectDeleteStockStatus, resetDeleteStockStatus } from '../redux/slice/stockIncrementSlice';
import { ActivityIndicator } from 'react-native-paper';

const StockCard = ({ stock, onEdit }) => {
  const dispatch = useDispatch();
  const deleteStockStatus = useSelector(selectDeleteStockStatus);
  const deleteStockError = useSelector(selectDeleteStockError);

  useEffect(() => {
    // Show success/error alerts when delete operation completes
    if (deleteStockStatus === 'succeeded') {
      Alert.alert('Success', 'Stock deleted successfully');
      dispatch(resetDeleteStockStatus());
    } else if (deleteStockStatus === 'failed') {
      Alert.alert('Error', deleteStockError || 'Failed to delete stock');
      dispatch(resetDeleteStockStatus());
    }
  }, [deleteStockStatus, deleteStockError, dispatch]);

  const handleStockDelete = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this stock?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => {
            if (stock?.id) {
              dispatch(deleteStockIncrement(stock.id));
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.brandName}>
          {stock.brand_name} <Text style={styles.volume}>{stock.volume_ml}ml</Text>
        </Text>
      </View>

      <View style={styles.body}>
        <InfoRow label="Bill ID" value={stock.bill_id} />
        <InfoRow label="Warehouse" value={stock.warehouse_name} />
        <InfoRow label="Cases" value={stock.cases} />
        <InfoRow label="Pieces" value={stock.pieces} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.date}>
          Updated: {new Date(stock.updated_at).toLocaleDateString()}
        </Text>
        <TouchableOpacity 
          style={styles.editBtn} 
          onPress={() => onEdit(stock)}
          disabled={deleteStockStatus === 'loading'}
        >
          <Icon name="pencil" size={18} color={colors.primary} />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        {deleteStockStatus === 'loading' ? (
          <ActivityIndicator size={'small'} color={colors.primary} />
        ) : (
          <TouchableOpacity 
            style={styles.editBtn} 
            onPress={handleStockDelete}
            disabled={deleteStockStatus === 'loading'}
          >
            <Icon name="delete" size={18} color={colors.danger} />
            <Text style={[styles.editText, {color: colors.danger}]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

// Your existing styles remain the same
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.secondary,
    paddingBottom: 6,
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    flex: 1,
    marginRight: 8,
  },
  volume: {
    fontSize: 14,
    color: colors.textDark,
    minWidth: 50,
    textAlign: 'right',
    fontWeight:'500',
  },
  body: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: colors.textDark,
  },
  value: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: colors.secondary,
    paddingTop: 6,
  },
  date: {
    fontSize: 11,
    color: colors.primary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  editText: {
    marginLeft: 4,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default StockCard;