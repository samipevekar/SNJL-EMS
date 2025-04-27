// SaleSheetsPage.js
import React, { useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import SaleSheetCard from '../../components/SaleSheetCard';
import { 
  fetchSaleSheetsAsync, 
  selectSaleSheets, 
  selectSaleSheetsLoading,
  clearSaleSheets
} from '../../redux/slice/saleSheetSlice';
import colors from '../../theme/colors';
import { selectUser } from '../../redux/slice/authSlice';
import { formatDateLeft } from '../../utils/formatDateLeft';

const SaleSheetsPage = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const saleSheets = useSelector(selectSaleSheets);
  const loading = useSelector(selectSaleSheetsLoading);
  const shopId = user?.assigned_shops?.length > 0 ? user.assigned_shops[0] : null;

  useFocusEffect(
    useCallback(() => {
      if (shopId) {
        dispatch(fetchSaleSheetsAsync({ shop_id: shopId, latest: 'true' }));
      }

      return () => {
        dispatch(clearSaleSheets());
      };
    }, [dispatch, shopId])
  );

  const handleAddNew = () => {
    navigation.navigate('SaleSheetForm', { shop_id: shopId });
  };

  const getCumulativeTotals = () => {
    let net_cash = 0;
    let cash_in_hand = 0;
    let upi = 0;
    let total_expenses = 0;
  
    saleSheets.forEach(sheet => {
      net_cash += Number(sheet.net_cash || 0);
      cash_in_hand += Number(sheet.cash_in_hand || 0);
      upi += Number(sheet.upi || 0);
  
      // Sum of all expenses per sheet
      if (Array.isArray(sheet.expenses)) {
        sheet.expenses.forEach(expense => {
          total_expenses += Number(expense.amount || 0);
        });
      }
    });
  
    return {
      net_cash,
      cash_in_hand,
      upi,
      total_expenses
    };
  };
  
  const { net_cash, cash_in_hand, upi, total_expenses } = getCumulativeTotals();


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sale Sheets</Text>
        <Text style={styles.date}>{saleSheets[0]?.sale_date ? formatDateLeft(saleSheets[0]?.sale_date) : ''}</Text>
      </View>

      {/* Cumulative Summary */}
      {saleSheets.length > 0 && (
  <View style={styles.summaryContainer}>
    <Text style={styles.summaryTitle}>Cumulative Totals</Text>
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>Net Cash:</Text>
      <Text style={styles.summaryValue}>₹{net_cash.toFixed(2)}</Text>
    </View>
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>Cash Collected:</Text>
      <Text style={styles.summaryValue}>₹{cash_in_hand.toFixed(2)}</Text>
    </View>
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>UPI:</Text>
      <Text style={styles.summaryValue}>₹{upi.toFixed(2)}</Text>
    </View>
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>Expenses:</Text>
      <Text style={styles.summaryValue}>₹{total_expenses.toFixed(2)}</Text>
    </View>
  </View>
)}


      {saleSheets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No sale sheets found</Text>
          {/* <TouchableOpacity 
            style={styles.emptyButton} 
            onPress={handleAddNew}
          >
            <Text style={styles.emptyButtonText}>Create First Sale Sheet</Text>
          </TouchableOpacity> */}
        </View>
      ) : (
        <FlatList
          data={saleSheets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <SaleSheetCard item={item} showEditButton={true} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  date:{
    fontSize:15,
    fontWeight:'bold'
  },
  summaryContainer: {
    backgroundColor: colors.white,
    padding: 16,
    margin: 15,
    borderRadius: 8,
    shadowColor: colors.black,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    // elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.textDark,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.primary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.grayDark,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  emptyButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SaleSheetsPage;
