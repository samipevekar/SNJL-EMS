import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';
import { formatDateLeft } from '../utils/formatDateLeft';
import { useNavigation } from '@react-navigation/native';

const SaleSheetCard = ({ item, showDate, showEditButton = true, onEditPress }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('SaleSheetDetails', { id: item.id });
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={styles.card}>
        <View style={styles.infoContainer}>
          <View style={styles.topRow}>
            <Text style={styles.brandName}>{item.brand_name}</Text>
            <Text style={styles.volume}>{item.volume_ml}ml</Text>
          </View>
          <View style={styles.bottomRow}>
            <Text style={styles.saleInfo}>Sale: {item.sale}</Text>
            <Text style={styles.balanceInfo}>Closing: {item.closing_balance}</Text>
            {showDate && <Text style={styles.saleDate}>{formatDateLeft(item.sale_date)}</Text>}
          </View>
        </View>
        
        {showEditButton && (
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => onEditPress(item)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
    maxWidth: '60%',
  },
  volume: {
    fontSize: 13,
    color: colors.primary,
    marginLeft: 8,
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  saleInfo: {
    fontSize: 13,
    color: colors.success,
    marginRight: 10,
  },
  balanceInfo: {
    fontSize: 13,
    color: colors.danger,
    marginRight: 10,
  },
  editButton: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  editButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  saleDate: {
    fontSize: 12,
    color: colors.gray,
  }
});

export default SaleSheetCard;