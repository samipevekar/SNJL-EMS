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
import { Picker } from '@react-native-picker/picker';
import { selectBrands, getBrandsAsync } from '../../redux/slice/brandSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

const WarehousePaymentPage = () => {
  const dispatch = useDispatch();
  const status = useSelector(selectPaymentStatus);
  const error = useSelector(selectPaymentError);
  const success = useSelector(selectPaymentSuccess);
  const user = useSelector(selectUser);
  const brands = useSelector(selectBrands);

  const [warehouses] = useState(['Warehouse A', 'Warehouse B', 'Warehouse C']);
  const [brandModalVisible, setBrandModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      warehouse_name: warehouses[0],
      bill_id: '',
      brand_name: '',
      cases: '',
      amount: ''
    }
  });

  useEffect(() => {
    dispatch(getBrandsAsync({type: 'foreign'}));
  }, []);

  const filteredBrands = brands.filter(brand =>
    brand.brand_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = (data) => {
    const paymentData = {
      ...data,
      cases: parseInt(data.cases, 10),
      amount: parseFloat(data.amount),
      user_id: user?.id
    };
    dispatch(addWarehousePaymentAsync(paymentData));
  };

  useEffect(() => {
    if (success) {
      Alert.alert('Success', 'Payment added successfully');
      reset({
        shop_id: '',
        warehouse_name: warehouses[0],
        bill_id: '',
        brand_name: brands[0]?.brand_name || '',
        cases: '',
        amount: ''
      });
      dispatch(resetPaymentState());
    }

    if (error) {
      Alert.alert('Error', error);
      dispatch(resetPaymentState());
    }
  }, [success, error, reset, dispatch]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Warehouse Payment</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Warehouse Name *</Text>
        <Controller
          control={control}
          name="warehouse_name"
          rules={{ required: 'Warehouse name is required' }}
          render={({ field: { onChange, value } }) => (
            <View style={[styles.pickerContainer, errors.warehouse_name && styles.errorInput]}>
              <Picker
                selectedValue={value}
                style={styles.picker}
                onValueChange={onChange}
                dropdownIconColor={colors.primary}
              >
                {warehouses.map((warehouse) => (
                  <Picker.Item key={warehouse} label={warehouse} value={warehouse} />
                ))}
              </Picker>
              {errors.warehouse_name && (
                <Text style={styles.errorText}>{errors.warehouse_name.message}</Text>
              )}
            </View>
          )}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Shop ID *</Text>
        <Controller
          control={control}
          rules={{ required: 'Shop ID is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                style={[styles.input, errors.shop_id && styles.errorInput]}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Enter Shop ID"
                keyboardType="numeric"
              />
              {errors.shop_id && (
                <Text style={styles.errorText}>{errors.shop_id.message}</Text>
              )}
            </>
          )}
          name="shop_id"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Bill ID *</Text>
        <Controller
          control={control}
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
          name="bill_id"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Brand *</Text>
        <Controller
          control={control}
          name="brand_name"
          rules={{ required: 'Brand is required' }}
          render={({ field: { value } }) => (
            <>
              <TouchableOpacity 
                style={[styles.brandInput, errors.brand_name && styles.errorInput]}
                onPress={() => setBrandModalVisible(true)}
              >
                <Text style={value ? styles.pickerText : styles.placeholderText}>
                  {value || 'Select Brand'}
                </Text>
                <Icon name="arrow-drop-down" size={24} color={colors.primary} />
              </TouchableOpacity>
              {errors.brand_name && (
                <Text style={styles.errorText}>{errors.brand_name.message}</Text>
              )}
            </>
          )}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Cases *</Text>
        <Controller
          control={control}
          rules={{
            required: 'Cases is required',
            pattern: {
              value: /^[0-9]+$/,
              message: 'Please enter a valid number'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                style={[styles.input, errors.cases && styles.errorInput]}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Enter Number of Cases"
                keyboardType="numeric"
              />
              {errors.cases && (
                <Text style={styles.errorText}>{errors.cases.message}</Text>
              )}
            </>
          )}
          name="cases"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Amount *</Text>
        <Controller
          control={control}
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
          name="amount"
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

      {/* Brand Selection Modal */}
      <Modal
        visible={brandModalVisible}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search brands..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setBrandModalVisible(false);
                setSearchQuery('');
              }}
            >
              <Icon name="close" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredBrands}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.brandItem}
                onPress={() => {
                  setValue('brand_name', item.brand_name);
                  setBrandModalVisible(false);
                  setSearchQuery('');
                }}
              >
                <Text style={styles.brandText}>{item.brand_name}</Text>
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
  brandInput: {
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
  errorInput: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.grayDark,
    borderRadius: 8,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
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
    elevation: 3,
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
  brandItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
    backgroundColor: colors.white,
  },
  brandText: {
    fontSize: 16,
    color: colors.textDark,
  },
  listContent: {
    paddingBottom: 16,
  },
});

export default WarehousePaymentPage;