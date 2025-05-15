import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Alert
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import { resetTransferStatus, selectTransferError, selectTransferStatus, transferStock } from '../../redux/slice/stockIncrementSlice';
import colors from '../../theme/colors';
import { selectUser } from '../../redux/slice/authSlice';
import { getAllShopsAsync, selectShops } from '../../redux/slice/shopSlice';
import { getBrandsAsync, selectBrands, selectBrandsStatus } from '../../redux/slice/brandSlice';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ActivityIndicator } from 'react-native-paper';

const TransferStock = () => {
  const dispatch = useDispatch();
  const { control, handleSubmit, setValue, watch,reset } = useForm();

  useEffect(()=>{
    dispatch(getBrandsAsync({type:''}))
    dispatch(getAllShopsAsync())
  },[])

  const [brandModalVisible, setBrandModalVisible] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');

  const user = useSelector(selectUser);
  const shops = useSelector(selectShops);
  const brands = useSelector(selectBrands);
  const brandStatus = useSelector(selectBrandsStatus)

  const transferStatus = useSelector(selectTransferStatus)
  const transferError = useSelector(selectTransferError)
  
   useEffect(() => {
    if (transferStatus === 'succeeded') {
      Alert.alert('Success', 'Stock transferred successfully');
      dispatch(resetTransferStatus());
      reset();
    } else if (transferStatus === 'failed') {
      Alert.alert('Transfer Failed', transferError || 'Error occurred');
      dispatch(resetTransferStatus());
    }
  }, [transferStatus]);



  const filteredBrands = useMemo(() => {
    return brands.filter(brand => brand.brand_name.toLowerCase().includes(brandSearch.toLowerCase()));
  }, [brandSearch, brands]);

  const onSubmit = (data) => {
    dispatch(transferStock(data))
  };

  const selectedBrand = watch('brand_name');


  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Transfer Stock</Text>

      <Text style={styles.label}>Brand</Text>
      <TouchableOpacity
        onPress={() => setBrandModalVisible(true)}
        style={styles.inputBox}
      >
        <Text style={styles.inputText}>{selectedBrand || 'Select Brand'}</Text>
      </TouchableOpacity>

      <Modal visible={brandModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TextInput
              placeholder="Search brand..."
              value={brandSearch}
              onChangeText={setBrandSearch}
              style={styles.searchInput}
            />
            <TouchableOpacity onPress={() => setBrandModalVisible(false)}>
              <Icon name="close" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>

          {brandStatus === 'loading' ? <ActivityIndicator size={'small'} color={colors.primary} /> : <FlatList
            data={filteredBrands}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setValue('brand_name', item.brand_name);
                  setValue('volume_ml', item.volume_ml);
                  setBrandModalVisible(false);
                }}
                style={styles.brandItem}
              >
                <Text style={styles.brandTxt}>{item.brand_name} ({item.volume_ml}ml)</Text>
              </TouchableOpacity>
            )}
          />}
        </View>
      </Modal>

      <Text style={styles.label}>Volume (ml)</Text>
      <Controller
        control={control}
        name="volume_ml"
        render={({ field: { value } }) => (
          <View style={styles.inputBox}>
            <Text style={styles.inputText}>{value ? `${value}ml` : 'Auto-selected'}</Text>
          </View>
        )}
      />

      <Text style={styles.label}>From Shop</Text>
      <Controller
        control={control}
        name="from_shop_id"
        render={({ field: { onChange, value } }) => (
          <View style={styles.pickerContainer}>
            <Picker selectedValue={value} onValueChange={onChange}>
              <Picker.Item label="Select shop" value="" />
              {user.role === 'manager' && shops.filter((shop)=>user.assigned_shops.includes(shop.shop_id)).map((shop) => (
                <Picker.Item key={shop.shop_id} label={`${shop.shop_name} (${shop.shop_id})`} value={shop.shop_id} />
              ))}
              {user.role === 'super_user' && shops.map(shop => (
                <Picker.Item key={shop.shop_id} label={`${shop.shop_name} (${shop.shop_id})`} value={shop.shop_id} />
              ))}
            </Picker>
          </View>
        )}
      />

      <Text style={styles.label}>To Shop</Text>
      <Controller
        control={control}
        name="to_shop_id"
        render={({ field: { onChange, value } }) => (
          <View style={styles.pickerContainer}>
            <Picker selectedValue={value} onValueChange={onChange}>
              <Picker.Item label="Select shop" value="" />
              {shops.map(shop => (
                <Picker.Item key={shop.shop_id} label={`${shop.shop_name} (${shop.shop_id})`} value={shop.shop_id} />
              ))}
            </Picker>
          </View>
        )}
      />

      <Text style={styles.label}>Cases</Text>
      <Controller
        control={control}
        name="cases"
        rules={{ required: true, min: 1 }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            placeholder="Enter number of cases"
            keyboardType="numeric"
            value={value ? value.toString() : ''}
            onChangeText={text => onChange(Number(text))}
            style={styles.inputBox}
          />
        )}
      />

       <TouchableOpacity
        onPress={handleSubmit(onSubmit)}
        style={styles.submitButton}
      >
        {transferStatus === 'loading' ? <ActivityIndicator size={'small'} color={colors.white} /> :<Text style={styles.submitText}>Transfer Stock</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.background,
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: colors.primary
  },
  label: {
    fontSize: 16,
    marginVertical: 8,
    fontWeight: '600',
    color: colors.textDark,
  },
  inputBox: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.grayLight,
    marginBottom: 12,
  },
  inputText: {
    fontSize: 16,
    color: colors.textDark
  },
  pickerContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.grayLight,
    marginBottom: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.grayLight,
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  brandItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  brandTxt:{
    fontSize:16
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 8,
    marginTop: 16
  },
  submitText: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize:16
  },
});

export default TransferStock;