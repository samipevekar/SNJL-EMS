import React, { useCallback, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard,
  ScrollView,
  Modal
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';

import StockIncrementCard from '../../components/StockIncrementCard';
import { selectUser } from '../../redux/slice/authSlice';
import { 
  fetchStockIncrementBrands, 
  selectStockIncrementBrands, 
  selectStockIncrementBrandsStatus 
} from '../../redux/slice/stockIncrementSlice';

import { 
  createSaleSheetAsync, 
  clearSaleSheetStatus, 
  selectSaleSheetStatus, 
  selectSaleSheetError 
} from '../../redux/slice/saleSheetSlice';

import colors from '../../theme/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TextInput } from 'react-native-gesture-handler';

const RecordSalePage = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const brands = useSelector(selectStockIncrementBrands);
  const status = useSelector(selectStockIncrementBrandsStatus);
  const createStatus = useSelector(selectSaleSheetStatus);
  const createError = useSelector(selectSaleSheetError);
  const shopId = user?.assigned_shops?.length > 0 ? user.assigned_shops[0] : null;
  
  const [saleData, setSaleData] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [upiAmount, setUpiAmount] = useState('');
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [expenseMessage, setExpenseMessage] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (shopId) {
        dispatch(fetchStockIncrementBrands(shopId));
      }
      return () => {
        dispatch(clearSaleSheetStatus());
      };
    }, [dispatch, shopId])
  );

  const handleCardChange = (data) => {
    setSaleData(prev => ({
      ...prev,
      [`${data.brand_name}-${data.volume_ml}`]: data
    }));
  };

  const handleAddExpense = () => {
    if (!expenseMessage || !expenseAmount) return;

    setExpenses([...expenses, {
      message: expenseMessage,
      amount: parseInt(expenseAmount)
    }]);
    setExpenseMessage('');
    setExpenseAmount('');
    setExpenseModalVisible(false);
  };

  const removeExpense = (index) => {
    const updatedExpenses = [...expenses];
    updatedExpenses.splice(index, 1);
    setExpenses(updatedExpenses);
  };

  const handleAddAllSales = async () => {
    if (!shopId) {
      Alert.alert('Error', 'Shop ID not available');
      return;
    }

    try {
      const salesToSubmit = Object.values(saleData).filter(item => item.sale > 0);

      if (salesToSubmit.length === 0) {
        Alert.alert('Error', 'Please enter sale quantities for at least one brand');
        return;
      }

      const result = await Promise.all(
        salesToSubmit.map((item, index) => {
          const isLast = index === salesToSubmit.length - 1;
          return dispatch(createSaleSheetAsync({
            shop_id: shopId,
            brand_name: item.brand_name,
            volume_ml: item.volume_ml,
            sale: item.sale,
            upi: isLast && upiAmount ? parseInt(upiAmount) : 0,
            expenses: isLast && expenses.length > 0 ? expenses : []
          })).unwrap();
        })
      );

      if (result.every(res => res.success)) {
        Alert.alert('Success', 'All sales recorded successfully');
        setSaleData({});
        setUpiAmount('');
        setExpenses([]);
      } else {
        Alert.alert('Error', 'Failed to record some sales');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to record sales');
    }
  };

  if (createStatus === 'loading' || status === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (status === 'failed') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load brands</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Record Sales</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('SaleSheetPage')} 
              style={styles.salesBtn}
            >
              <Text style={styles.salesTxt}>All Sales</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.addStock} 
            onPress={() => navigation.navigate('StockIncrementForm')}
          >
            <Icon name="add-circle" size={24} color={colors.primary} />
            <Text style={styles.stockTxt}>Add Stock</Text>
          </TouchableOpacity>

          {brands.length === 0 ? (
            <Text style={styles.emptyText}>No brands found for this shop</Text>
          ) : (
            <ScrollView style={styles.scrollView}>
              <FlatList
                data={brands}
                keyExtractor={(item, index) => `${item.brand_name}-${item.volume_ml}-${index}`}
                renderItem={({ item }) => (
                  <StockIncrementCard
                    brand_name={item.brand_name}
                    volume_ml={item.volume_ml}
                    onChange={handleCardChange}
                  />
                )}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={false}
              />

              <View style={styles.upiContainer}>
                <Text style={styles.label}>UPI Amount (Optional)</Text>
                <TextInput
                  style={styles.upiInput}
                  placeholder="Enter UPI amount"
                  keyboardType="numeric"
                  value={upiAmount}
                  onChangeText={(text) => {
                    if (/^\d*$/.test(text)) {
                      setUpiAmount(text);
                    }
                  }}
                />
              </View>

              <TouchableOpacity 
                style={styles.expenseButton} 
                onPress={() => setExpenseModalVisible(true)}
              >
                <Text style={styles.expenseButtonText}>Add Expenses</Text>
              </TouchableOpacity>

              {expenses.length > 0 && (
                <View style={styles.expensesList}>
                  {expenses.map((item, index) => (
                    <View key={index} style={styles.expenseItem}>
                      <Text style={styles.expenseText}>{item.message}: ₹{item.amount}</Text>
                      <TouchableOpacity onPress={() => removeExpense(index)}>
                        <Text style={styles.removeExpense}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity 
                style={styles.addAllButton} 
                onPress={handleAddAllSales}
                disabled={createStatus === 'loading'}
              >
                {createStatus === 'loading' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addAllButtonText}>Add All Sales</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* Expense Modal */}
          <Modal
            visible={expenseModalVisible}
            transparent
            animationType="slide"
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Add Expense</Text>

                  <TextInput
                    style={[styles.upiInput,{marginBottom:10}]}
                    placeholder="Message"
                    value={expenseMessage}
                    onChangeText={setExpenseMessage}
                  />
                  <TextInput
                    style={styles.upiInput}
                    placeholder="Amount"
                    keyboardType="numeric"
                    value={expenseAmount}
                    onChangeText={(text) => {
                      if (/^\d*$/.test(text)) {
                        setExpenseAmount(text);
                      }
                    }}
                  />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                    <TouchableOpacity 
                      style={[styles.expenseButton, { flex: 1, marginRight: 10 }]} 
                      onPress={() => setExpenseModalVisible(false)}
                    >
                      <Text style={styles.expenseButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.expenseButton, { flex: 1, backgroundColor: colors.primary }]} 
                      onPress={handleAddExpense}
                    >
                      <Text style={[styles.expenseButtonText, { color: '#fff' }]}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 16,
  },
  salesBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 10,
  },
  salesTxt: {
    color: colors.white,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: colors.grayDark,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: colors.danger,
  },
  addStock: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    gap: 5,
    backgroundColor: colors.secondary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    borderRadius: 8
  },
  stockTxt: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary
  },
  upiContainer: {
    marginHorizontal: 10,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: colors.textDark,
  },
  upiInput: {
    height: 40,
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    fontSize: 14,
  },
  expenseButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 16,
  },
  expenseButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  expensesList: {
    marginHorizontal: 10,
    marginBottom: 16,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  expenseText: {
    fontSize: 14,
    color: colors.textDark,
  },
  removeExpense: {
    color: colors.danger,
    fontSize: 20,
    paddingHorizontal: 8,
  },
  addAllButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 20,
  },
  addAllButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.textDark,
  },
});

export default RecordSalePage;