import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  FlatList,
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
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Add Stock Increment</Text>

      {/* Warehouse Name */}
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
            {errors.warehouse_name && (
              <Text style={styles.errorText}>{errors.warehouse_name.message}</Text>
            )}
          </View>
        )}
      />

      {/* Bill ID */}
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
          <>
            <TextInput
              style={[styles.input, errors.bill_id && styles.errorInput]}
              keyboardType="numeric"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
            />
            {errors.bill_id && <Text style={styles.errorText}>{errors.bill_id.message}</Text>}
          </>
        )}
      />

      {/* Brand Name */}
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

      {/* Volume */}
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
          <>
            <TextInput
              style={[styles.input, errors.volume_ml && styles.errorInput]}
              keyboardType="numeric"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
            />
            {errors.volume_ml && <Text style={styles.errorText}>{errors.volume_ml.message}</Text>}
          </>
        )}
      />

      {/* Cases */}
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
          <>
            <TextInput
              style={[styles.input, errors.cases && styles.errorInput]}
              keyboardType="numeric"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
            />
            {errors.cases && <Text style={styles.errorText}>{errors.cases.message}</Text>}
          </>
        )}
      />

      <View style={{ marginVertical: 20 }}>
        <Button
          disabled={status === 'loading'}
          title={status === 'loading' ? "Submitting..." : "Submit"}
          onPress={handleSubmit(onSubmit)}
          color={colors.primary}
        />
      </View>

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
    backgroundColor: colors.background,
    padding: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.primary,
    textAlign: 'center',
  },
  label: {
    marginTop: 10,
    marginBottom: 4,
    fontWeight: '600',
    color: colors.primary,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grayDark,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputContainer: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grayDark,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  errorInput: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: 8,
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
  modalContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grayDark,
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
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
  },
  listContent: {
    paddingBottom: 16,
  },
});

export default StockIncrementForm;