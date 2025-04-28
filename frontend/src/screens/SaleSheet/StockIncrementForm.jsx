import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../../theme/colors';
import { addStockIncrement, resetAddStockStatus, selectAddStockError, selectAddStockStatus } from '../../redux/slice/stockIncrementSlice';
import { getBrandsAsync, selectBrands } from '../../redux/slice/brandSlice';
import { selectUser } from '../../redux/slice/authSlice';

const StockIncrementForm = () => {
  const dispatch = useDispatch();
  const brandOptions = useSelector(selectBrands);
  const warehouseOptions = ['Warehouse A', 'Warehouse B', 'Warehouse C'];
  const status = useSelector(selectAddStockStatus);
  const error = useSelector(selectAddStockError);
  const user = useSelector(selectUser);

  const [brandModalVisible, setBrandModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      shop_id: '',
      brand_name: '',
      volume_ml: '',
      warehouse_name: '',
      bill_id: '',
      cases: '',
    },
  });

  const filteredBrands = brandOptions.filter(brand =>
    brand.brand_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = (data) => {
    const stockData = {
      shop_id: user?.assigned_shops[0],
      bill_id: Number(data.bill_id),
      brand_name: data.brand_name,
      volume_ml: Number(data.volume_ml),
      warehouse_name: data.warehouse_name,
      cases: Number(data.cases),
    };
    dispatch(addStockIncrement(stockData));
  };

  useEffect(() => {
    if (status === 'succeeded') {
      Alert.alert('Success', 'Stock increment added successfully!');
      reset();
      dispatch(resetAddStockStatus());
    } else if (status === 'failed' && error) {
      Alert.alert('Error', typeof error === 'string' ? error : 'Failed to add stock increment');
      dispatch(resetAddStockStatus());
    }
  }, [status, error]);

  useEffect(() => {
    dispatch(getBrandsAsync({type:'foreign'}));
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.heading}>Add Stock</Text>

      {/* Warehouse Name */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Warehouse Name *</Text>
        <Controller
          control={control}
          name="warehouse_name"
          rules={{ required: 'Warehouse name is required' }}
          render={({ field: { onChange, value } }) => (
            <View style={[styles.inputContainer, errors.warehouse_name && styles.errorInput]}>
              <Picker
                selectedValue={value}
                onValueChange={onChange}
                style={styles.picker}
                dropdownIconColor={colors.primary}
              >
                <Picker.Item label="Select Warehouse" value="" />
                {warehouseOptions.map((w) => (
                  <Picker.Item key={w} label={w} value={w} />
                ))}
              </Picker>
            </View>
          )}
        />
        {errors.warehouse_name && (
          <Text style={styles.errorText}>{errors.warehouse_name.message}</Text>
        )}
      </View>

      {/* Bill ID */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Bill ID *</Text>
        <Controller
          control={control}
          name="bill_id"
          rules={{ 
            required: 'Bill ID is required',
            pattern: {
              value: /^\d+$/,
              message: 'Bill ID must be a number'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.bill_id && styles.errorInput]}
              keyboardType="numeric"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              placeholder="Enter bill number"
            />
          )}
        />
        {errors.bill_id && <Text style={styles.errorText}>{errors.bill_id.message}</Text>}
      </View>

      {/* Brand Name */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Brand Name *</Text>
        <Controller
          control={control}
          name="brand_name"
          rules={{ required: 'Brand name is required' }}
          render={({ field: { value } }) => (
            <>
              <TouchableOpacity 
                style={[styles.input, errors.brand_name && styles.errorInput]}
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

      {/* Volume */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Volume (ml) *</Text>
        <Controller
          control={control}
          name="volume_ml"
          rules={{ 
            required: 'Volume is required',
            pattern: {
              value: /^\d+$/,
              message: 'Volume must be a number'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.volume_ml && styles.errorInput]}
              keyboardType="numeric"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              placeholder="Enter volume in ml"
            />
          )}
        />
        {errors.volume_ml && <Text style={styles.errorText}>{errors.volume_ml.message}</Text>}
      </View>

      {/* Cases */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Cases *</Text>
        <Controller
          control={control}
          name="cases"
          rules={{ 
            required: 'Cases is required',
            pattern: {
              value: /^\d+$/,
              message: 'Cases must be a number'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.cases && styles.errorInput]}
              keyboardType="numeric"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              placeholder="Enter number of cases"
            />
          )}
        />
        {errors.cases && <Text style={styles.errorText}>{errors.cases.message}</Text>}
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        disabled={status === 'loading'}
        onPress={handleSubmit(onSubmit)}
      >
        {status === 'loading' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Add Stock</Text>
        )}
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
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.primary,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    color: colors.textPrimary,
    fontSize: 14,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grayLight,
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputContainer: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: 8,
    overflow: 'hidden',
    height: 50,
    justifyContent: 'center',
  },
  picker: {
    // height: '100%',
    width: '100%',
  },
  errorInput: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  placeholderText: {
    flex: 1,
    fontSize: 16,
    color: colors.grayDark,
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
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
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
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: 16,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default StockIncrementForm;