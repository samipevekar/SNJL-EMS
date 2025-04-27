// src/screens/WarehousePaymentScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import colors from '../../theme/colors';
import { selectPaymentError, selectPaymentStatus, selectPaymentSuccess, addWarehousePaymentAsync, resetPaymentState } from '../../redux/slice/warehousePaymentSlice';
import { selectUser } from '../../redux/slice/authSlice';
import { Picker } from '@react-native-picker/picker';

const WarehousePaymentPage = () => {
  const dispatch = useDispatch();
  const status = useSelector(selectPaymentStatus);
  const error = useSelector(selectPaymentError);
  const success = useSelector(selectPaymentSuccess);
  const user = useSelector(selectUser);

  const [warehouses, setWarehouses] = useState(['Warehouse A', 'Warehouse B', 'Warehouse C']);
  const [brands, setBrands] = useState(['Brand A', 'Brand B', 'Brand C']);
  const liquorTypes = ['country', 'foreign', 'beer'];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      user_id: user?.id || '',
      shop_id: '',
      warehouse_name: warehouses[0],
      bill_id: '',
      brand: brands[0],
      cases: '',
      amount: '',
      liquor_type: 'country'
    }
  });

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
        brand: brands[0],
        cases: '',
        amount: '',
        liquor_type: 'country'
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
        <Text style={styles.label}>Warehouse Name</Text>
        <Controller
          control={control}
          name="warehouse_name"
          render={({ field: { onChange, value } }) => (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={value}
                style={styles.picker}
                onValueChange={(itemValue) => onChange(itemValue)}
              >
                {warehouses.map((warehouse) => (
                  <Picker.Item key={warehouse} label={warehouse} value={warehouse} />
                ))}
              </Picker>
            </View>
          )}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Shop ID</Text>
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
        <Text style={styles.label}>Bill ID</Text>
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
        <Text style={styles.label}>Brand</Text>
        <Controller
          control={control}
          name="brand"
          render={({ field: { onChange, value } }) => (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={value}
                style={styles.picker}
                onValueChange={(itemValue) => onChange(itemValue)}
              >
                {brands.map((brand) => (
                  <Picker.Item key={brand} label={brand} value={brand} />
                ))}
              </Picker>
            </View>
          )}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Cases</Text>
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
        <Text style={styles.label}>Amount</Text>
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

      <View style={styles.formGroup}>
        <Text style={styles.label}>Liquor Type</Text>
        <View style={styles.radioGroup}>
          {liquorTypes.map((type) => (
            <Controller
              key={type}
              control={control}
              name="liquor_type"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => onChange(type)}
                >
                  <View style={[
                    styles.radioOuter,
                    value === type && styles.radioOuterSelected
                  ]}>
                    {value === type && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.radioLabel}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          ))}
        </View>
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
    color: colors.textDark,
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: colors.textDark,
  },
  input: {
    height: 40,
    borderColor: colors.grayDark,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
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
    borderRadius: 5,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 10,
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: 16,
    color: colors.textDark,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WarehousePaymentPage;