import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import colors from '../../theme/colors';
import { 
  selectPaymentError, 
  selectPaymentStatus, 
  selectPaymentSuccess, 
  addWarehousePaymentAsync, 
  resetPaymentState 
} from '../../redux/slice/warehousePaymentSlice';
import { selectUser } from '../../redux/slice/authSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getWarehousesAsync, selectWarehouses } from '../../redux/slice/warehouseSlice';
import { selectShops, getAllShopsAsync } from '../../redux/slice/shopSlice';
import DateTimePicker from '@react-native-community/datetimepicker';

const WarehousePaymentPage = () => {
  const dispatch = useDispatch();
  const status = useSelector(selectPaymentStatus);
  const error = useSelector(selectPaymentError);
  const success = useSelector(selectPaymentSuccess);
  const user = useSelector(selectUser);
  const shops = useSelector(selectShops);
  const warehouses = useSelector(selectWarehouses);

  const [warehouseModalVisible, setWarehouseModalVisible] = useState(false);
  const [shopModalVisible, setShopModalVisible] = useState(false);
  const [warehouseSearchQuery, setWarehouseSearchQuery] = useState('');
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      user_id: user?.id || '',
      shop_id: '',
      warehouse_name: '',
      bill_id: '',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0]
    }
  });

  useEffect(() => {
    dispatch(getWarehousesAsync());
  }, []);

  // Filter shops based on user role
  const getFilteredShops = () => {
    if (user?.role === 'manager' && user?.assigned_shops) {
      return shops.filter(shop => 
        user.assigned_shops.includes(shop.shop_id) &&
        shop.shop_name.toLowerCase().includes(shopSearchQuery.toLowerCase())
      );
    }
    return shops.filter(shop => 
      shop.shop_name.toLowerCase().includes(shopSearchQuery.toLowerCase())
    );
  };

  const filteredWarehouses = warehouses.filter(warehouse =>
    warehouse.warehouse_name.toLowerCase().includes(warehouseSearchQuery.toLowerCase())
  );

  const filteredShops = getFilteredShops();

  const onSubmit = (data) => {
    const paymentData = {
      ...data,
      amount: parseFloat(data.amount),
      user_id: user?.id,
      payment_date: selectedDate.toISOString().split('T')[0]
    };
    dispatch(addWarehousePaymentAsync(paymentData));
  };

  useEffect(() => {
    if (success) {
      Alert.alert('Success', 'Payment added successfully');
      reset({
        shop_id: '',
        warehouse_name: '',
        bill_id: '',
        amount: ''
      });
      setSelectedDate(new Date());
      dispatch(resetPaymentState());
    }

    if (error) {
      Alert.alert('Error', error);
      dispatch(resetPaymentState());
    }
  }, [success, error, reset, dispatch]);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || selectedDate;
    setShowDatePicker(false);
    setSelectedDate(currentDate);
    setValue('payment_date', currentDate.toISOString().split('T')[0]);
  };

  useEffect(()=>{
    dispatch(getAllShopsAsync())
  },[])

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Warehouse Payment</Text>

      {/* Payment Date */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Payment Date *</Text>
        <Controller
          control={control}
          name="payment_date"
          rules={{ required: 'Payment date is required' }}
          render={({ field: { value } }) => (
            <>
              <TouchableOpacity 
                style={[styles.dateInput, errors.payment_date && styles.errorInput]}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="calendar-today" size={20} color={colors.primary} style={styles.dateIcon} />
                <Text style={styles.dateText}>
                  {selectedDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {errors.payment_date && (
                <Text style={styles.errorText}>{errors.payment_date.message}</Text>
              )}
            </>
          )}
        />
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onChangeDate}
            maximumDate={new Date()}
          />
        )}
      </View>

      {/* Warehouse Name */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Warehouse Name *</Text>
        <Controller
          control={control}
          name="warehouse_name"
          rules={{ required: 'Warehouse name is required' }}
          render={({ field: { value } }) => (
            <>
              <TouchableOpacity 
                style={[styles.pickerInput, errors.warehouse_name && styles.errorInput]}
                onPress={() => setWarehouseModalVisible(true)}
              >
                <Text style={value ? styles.pickerText : styles.placeholderText}>
                  {value || 'Select Warehouse'}
                </Text>
                <Icon name="arrow-drop-down" size={24} color={colors.primary} />
              </TouchableOpacity>
              {errors.warehouse_name && (
                <Text style={styles.errorText}>{errors.warehouse_name.message}</Text>
              )}
            </>
          )}
        />
      </View>

      {/* Shop ID */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Shop *</Text>
        <Controller
          control={control}
          name="shop_id"
          rules={{ required: 'Shop is required' }}
          render={({ field: { value } }) => (
            <>
              <TouchableOpacity 
                style={[styles.pickerInput, errors.shop_id && styles.errorInput]}
                onPress={() => setShopModalVisible(true)}
              >
                <Text style={value ? styles.pickerText : styles.placeholderText}>
                  {value ? `${value} - ${shops.find(s => s.shop_id === value)?.shop_name || ''}` : 'Select Shop'}
                </Text>
                <Icon name="arrow-drop-down" size={24} color={colors.primary} />
              </TouchableOpacity>
              {errors.shop_id && (
                <Text style={styles.errorText}>{errors.shop_id.message}</Text>
              )}
            </>
          )}
        />
      </View>

      {/* Bill ID */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Bill ID *</Text>
        <Controller
          control={control}
          name="bill_id"
          rules={{ required: 'Bill ID is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                style={[styles.input, errors.bill_id && styles.errorInput]}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Enter Bill ID"
                keyboardType="numeric"
              />
              {errors.bill_id && (
                <Text style={styles.errorText}>{errors.bill_id.message}</Text>
              )}
            </>
          )}
        />
      </View>

      {/* Amount */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Amount *</Text>
        <Controller
          control={control}
          name="amount"
          rules={{
            required: 'Amount is required',
            pattern: {
              value: /^\d+(\.\d{1,2})?$/,
              message: 'Please enter a valid amount'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                style={[styles.input, errors.amount && styles.errorInput]}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Enter Amount"
                keyboardType="numeric"
              />
              {errors.amount && (
                <Text style={styles.errorText}>{errors.amount.message}</Text>
              )}
            </>
          )}
        />
      </View>

      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={handleSubmit(onSubmit)}
        disabled={status === 'loading'}
      >
        <Text style={styles.submitButtonText}>
          {status === 'loading' ? 'Submitting...' : 'Submit Payment'}
        </Text>
      </TouchableOpacity>

      {/* Warehouse Selection Modal */}
      <Modal
        visible={warehouseModalVisible}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search warehouses..."
              value={warehouseSearchQuery}
              onChangeText={setWarehouseSearchQuery}
              autoFocus={true}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setWarehouseModalVisible(false);
                setWarehouseSearchQuery('');
              }}
            >
              <Icon name="close" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredWarehouses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => {
                  setValue('warehouse_name', item.warehouse_name);
                  setWarehouseModalVisible(false);
                  setWarehouseSearchQuery('');
                }}
              >
                <Text style={styles.listItemText}>
                  {item.warehouse_name} ({item.liquor_type})
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </Modal>

      {/* Shop Selection Modal */}
      <Modal
        visible={shopModalVisible}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search shops..."
              value={shopSearchQuery}
              onChangeText={setShopSearchQuery}
              autoFocus={true}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShopModalVisible(false);
                setShopSearchQuery('');
              }}
            >
              <Icon name="close" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredShops}
            keyExtractor={(item) => item.shop_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => {
                  setValue('shop_id', item.shop_id);
                  setShopModalVisible(false);
                  setShopSearchQuery('');
                }}
              >
                <Text style={styles.listItemText}>
                  {item.shop_id} - {item.shop_name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: colors.primary,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderColor: colors.grayDark,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: colors.white,
    fontSize: 16,
  },
  pickerInput: {
    height: 50,
    borderColor: colors.grayDark,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInput: {
    height: 50,
    borderColor: colors.grayDark,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 10,
  },
  dateText: {
    fontSize: 16,
  },
  errorInput: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 5,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
  },
  placeholderText: {
    flex: 1,
    fontSize: 16,
    color: colors.grayDark,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    elevation: 5,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grayDark,
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    fontSize: 16,
  },
  closeButton: {
    padding: 8,
  },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
    backgroundColor: colors.white,
  },
  listItemText: {
    fontSize: 16,
    color: colors.textDark,
  },
  listContent: {
    paddingBottom: 16,
  },
});

export default WarehousePaymentPage;