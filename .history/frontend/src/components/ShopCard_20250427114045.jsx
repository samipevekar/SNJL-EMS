import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React from 'react';
import colors  from '../theme/colors'; // Import colors
import { useNavigation } from '@react-navigation/native';

const ShopCard = ({ shop_name, expense, sale,shop_id }) => {
  const navigation = useNavigation(); // Access navigation

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('ShopDetails', { shop_name, expense, sale })} // Navigate to ShopDetails
    >
      {/* Left - Shop Name */}
      <View>
        <Text>{shop_id}</Text>
        <Text style={styles.shopName}>{shop_name}</Text>
      </View>

      {/* Right - Sales & Expenses */}
      <View style={styles.amounts}>
        <Text style={styles.sale}>Sale: ₹{sale}</Text>
        <Text style={styles.expense}>Exp: ₹{expense}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default ShopCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: colors.white, 
    padding: 15, 
    marginVertical: 8,
    borderRadius: 10, 
    shadowColor: colors.shadow, 
    shadowOpacity: 0.1, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowRadius: 4, 
  },
  shopName: {
    fontSize: 18, 
    fontWeight: 'bold', 
    color: colors.text,
  },
  amounts: {
    alignItems: 'flex-end',
  },
  sale: {
    fontSize: 16, 
    fontWeight: 'bold', 
    color: colors.success, // Sale Amount Color
  },
  expense: {
    fontSize: 14, 
    color: colors.danger, // Expense Amount Color
  },
});
