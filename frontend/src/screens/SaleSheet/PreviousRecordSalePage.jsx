import React, { useCallback, useEffect, useState } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

import StockIncrementCard from '../../components/StockIncrementCard';
import { selectUser } from '../../redux/slice/authSlice';
import { 
  fetchStockIncrementBrands, 
  selectStockIncrementBrands, 
  selectStockIncrementBrandsError, 
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
import { getAllShopsAsync, selectShops } from '../../redux/slice/shopSlice';

const PreviousRecordSalePage = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const shops = useSelector(selectShops);
  const brands = useSelector(selectStockIncrementBrands);
  const status = useSelector(selectStockIncrementBrandsStatus);
  const createStatus = useSelector(selectSaleSheetStatus);
  
  const [saleData, setSaleData] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [upiAmount, setUpiAmount] = useState('');
  const [canteenAmount, setCanteenAmount] = useState('');
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [expenseMessage, setExpenseMessage] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [shopId, setShopId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Filter shops based on user role
  const filteredShops = user?.role === 'manager' 
    ? shops.filter(shop => user.assigned_shops?.includes(shop.shop_id))
    : shops;

  const handleFetchBrands = () => {
    if (!shopId) {
      Alert.alert('Error', 'Please select a shop');
      return;
    }
    
    dispatch(fetchStockIncrementBrands(shopId))
      .unwrap()
      .catch(error => {
        Alert.alert('Error', error || 'Failed to fetch brands for this shop');
      });
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        dispatch(clearSaleSheetStatus());
      };
    }, [dispatch])
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
      Alert.alert('Error', 'Shop ID is required');
      return;
    }

    try {
      const salesToSubmit = Object.values(saleData).filter(item => item.sale > 0);

      if (salesToSubmit.length === 0) {
        Alert.alert('Error', 'Please enter sale quantities for at least one brand');
        return;
      }

      const formattedDate = saleDate.toISOString().split('T')[0];

      const result = await Promise.all(
        salesToSubmit.map((item, index) => {
          const isLast = index === salesToSubmit.length - 1;
          return dispatch(createSaleSheetAsync({
            shop_id: shopId,
            brand_name: item.brand_name,
            volume_ml: item.volume_ml,
            sale: item.sale,
            upi: isLast && upiAmount ? parseInt(upiAmount) : 0,
            expenses: isLast && expenses.length > 0 ? expenses : [],
            canteen: isLast && canteenAmount ? parseInt(canteenAmount) : 0,
            sale_date: formattedDate
          })).unwrap();
        })
      );

      if (result.every(res => res.success)) {
        Alert.alert('Success', 'All sales recorded successfully');
        setSaleData({});
        setUpiAmount('');
        setCanteenAmount('')
        setExpenses([]);
      } else {
        Alert.alert('Error', 'Failed to record some sales');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to record sales');
    }
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || saleDate;
    setShowDatePicker(false);
    setSaleDate(currentDate);
  };

  useEffect(() => {
    dispatch(getAllShopsAsync());
  }, []);
  
  if (createStatus === 'loading' || status === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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
            <Text style={styles.title}>Record Previous Sales</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Select Shop</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={shopId}
                onValueChange={(itemValue) => setShopId(itemValue)}
                style={styles.picker}
                dropdownIconColor={colors.primary}
              >
                <Picker.Item label="Select a shop" value="" />
                {filteredShops.map(shop => (
                  <Picker.Item 
                    key={shop.shop_id} 
                    label={`${shop.shop_name} (${shop.shop_id})`} 
                    value={shop.shop_id} 
                  />
                ))}
              </Picker>
            </View>
            
            <TouchableOpacity 
              style={styles.fetchButton} 
              onPress={handleFetchBrands}
            >
              <Text style={styles.fetchButtonText}>Fetch Brands</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Sale Date</Text>
            <TouchableOpacity 
              style={styles.dateInput} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{saleDate.toLocaleDateString()}</Text>
              <Icon name="calendar-today" size={20} color={colors.primary} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={saleDate}
                mode="date"
                display="default"
                onChange={onChangeDate}
                maximumDate={new Date()}
              />
            )}
          </View>

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

              <View style={styles.upiContainer}>
                <TextInput
                  style={styles.upiInput}
                  placeholder="Enter canteen amount"
                  keyboardType="numeric"
                  value={canteenAmount}
                  onChangeText={(text) => {
                    if (/^\d*$/.test(text)) {
                      setCanteenAmount(text);
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
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
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
  inputContainer: {
    marginBottom: 16,
    marginHorizontal: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: colors.textDark,
  },
  pickerContainer: {
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: colors.white,
    marginBottom: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 53,
    width: '100%',
  },
  dateInput: {
    height: 40,
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    fontSize: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fetchButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  fetchButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  upiContainer: {
    marginHorizontal: 10,
    marginBottom: 16,
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

export default PreviousRecordSalePage;