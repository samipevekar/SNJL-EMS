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
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import colors from '../../theme/colors';
import { addStockIncrement, resetAddStockStatus, selectAddStockError, selectAddStockStatus } from '../../redux/slice/stockIncrementSlice';
import { clearBrands, getBrandsAsync, selectBrands, selectBrandsStatus } from '../../redux/slice/brandSlice';
import { selectUser } from '../../redux/slice/authSlice';
import { getWarehousesAsync, selectWarehouses, selectWarehouseStatus } from '../../redux/slice/warehouseSlice';
import { getAllShopsAsync, selectShops } from '../../redux/slice/shopSlice';

const PreviousStockIncrementForm = ({navigation}) => {
  const dispatch = useDispatch();
  const brandOptions = useSelector(selectBrands);
  const warehouseOptions = useSelector(selectWarehouses);
  const shops = useSelector(selectShops);
  const status = useSelector(selectAddStockStatus);
  const error = useSelector(selectAddStockError);
  const user = useSelector(selectUser);
  const brandStatus = useSelector(selectBrandsStatus);
  const warehouseStatus = useSelector(selectWarehouseStatus);

  const [brandModalVisible, setBrandModalVisible] = useState(false);
  const [warehouseModalVisible, setWarehouseModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBrandIndex, setCurrentBrandIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shopId, setShopId] = useState('');
  const [stockDate, setStockDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Filter shops based on user role
  const filteredShops = user?.role === 'manager' 
    ? shops.filter(shop => user.assigned_shops?.includes(shop.shop_id))
    : shops;

  const { 
    control, 
    handleSubmit, 
    reset, 
    setValue, 
    watch,
    formState: { errors } 
  } = useForm({
    defaultValues: {
      warehouse_name: '',
      bill_id: '',
      brands: [{ brand_name: '', volume_ml: '', cases: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'brands',
  });

  const watchBrands = watch('brands');

  const onSubmit = (data) => {
    if (!shopId) {
      Alert.alert('Error', 'Please select a shop');
      return;
    }

    setLoading(true);
    
    // Format the date to YYYY-MM-DD
    const formattedDate = stockDate.toISOString().split('T')[0];
    
    // Process each brand entry
    const promises = data.brands.map(brand => {
      const stockData = {
        shop_id: shopId,
        bill_id: Number(data.bill_id),
        brand_name: brand.brand_name,
        volume_ml: Number(brand.volume_ml),
        warehouse_name: data.warehouse_name,
        cases: Number(brand.cases),
        stock_date: formattedDate
      };
      
      return dispatch(addStockIncrement(stockData)).unwrap();
    });

    Promise.all(promises)
      .then(() => {
        Alert.alert('Success', 'All stock increments added successfully!');
        reset();
      })
      .catch(error => {
        Alert.alert('Error', error || 'Failed to add some stock increments');
        console.log(error)
      })
      .finally(() => {
        setLoading(false);
        dispatch(resetAddStockStatus());
      });
  };

  useEffect(() => {  
    dispatch(getBrandsAsync({type:''}));
    dispatch(getWarehousesAsync());
    dispatch(getAllShopsAsync());
  }, []);
  
  useEffect(() => {
    if (status === 'failed' && error) {
      Alert.alert('Error', typeof error === 'string' ? error : 'Failed to add stock increment');
      dispatch(resetAddStockStatus());
    }
  }, [status, error]);


  const filteredBrands = brandOptions.filter(brand =>
    brand.brand_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddBrand = () => {
    append({ brand_name: '', volume_ml: '', cases: '' });
  };

  const handleRemoveBrand = (index) => {
    remove(index);
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || stockDate;
    setShowDatePicker(false);
    setStockDate(currentDate);
  };

  const renderBrandItem = ({ item, index }) => (
    <View style={styles.brandItemContainer}>
      <View style={styles.brandHeader}>
        <Text style={styles.brandNumber}>Brand #{index + 1}</Text>
        {index > 0 && (
          <TouchableOpacity 
            style={styles.removeBrandButton}
            onPress={() => handleRemoveBrand(index)}
          >
            <Icon name="delete" size={20} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      {/* Brand Name */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Brand Name *</Text>
        <Controller
          control={control}
          name={`brands.${index}.brand_name`}
          rules={{ required: 'Brand name is required' }}
          render={({ field: { value } }) => (
            <>
              <TouchableOpacity 
                style={[styles.input, errors.brands?.[index]?.brand_name && styles.errorInput]}
                onPress={() => {
                  setCurrentBrandIndex(index);
                  setBrandModalVisible(true);
                }}
              >
                <Text style={value ? styles.pickerText : styles.placeholderText}>
                  {value || 'Select Brand'}
                </Text>
                <Icon name="arrow-drop-down" size={24} color={colors.primary} />
              </TouchableOpacity>
              {errors.brands?.[index]?.brand_name && (
                <Text style={styles.errorText}>{errors.brands[index].brand_name.message}</Text>
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
          name={`brands.${index}.volume_ml`}
          rules={{ 
            required: 'Volume is required',
            pattern: {
              value: /^\d+$/,
              message: 'Volume must be a number'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.brands?.[index]?.volume_ml && styles.errorInput]}
              keyboardType="numeric"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              placeholder="Enter volume in ml"
              editable={false}
            />
          )}
        />
        {errors.brands?.[index]?.volume_ml && (
          <Text style={styles.errorText}>{errors.brands[index].volume_ml.message}</Text>
        )}
      </View>

      {/* Cases */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Cases *</Text>
        <Controller
          control={control}
          name={`brands.${index}.cases`}
          rules={{ 
            required: 'Cases is required',
            pattern: {
              value: /^\d+$/,
              message: 'Cases must be a number'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.brands?.[index]?.cases && styles.errorInput]}
              keyboardType="numeric"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              placeholder="Enter number of cases"
            />
          )}
        />
        {errors.brands?.[index]?.cases && (
          <Text style={styles.errorText}>{errors.brands[index].cases.message}</Text>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={styles.heading}>Add Previous Stock</Text>

        <TouchableOpacity style={styles.allStocksBtn} onPress={()=>navigation.navigate('PreviousAllStockPage')}><Text style={styles.allStocks}>All Stocks</Text></TouchableOpacity>

      </View>

      {/* Shop Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Select Shop *</Text>
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
      </View>

      {/* Stock Date */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Stock Date *</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{stockDate.toLocaleDateString()}</Text>
          <Icon name="calendar-today" size={20} color={colors.primary} />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={stockDate}
            mode="date"
            display="default"
            onChange={onChangeDate}
            maximumDate={new Date()}
          />
        )}
      </View>

      {/* Warehouse Name */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Warehouse Name *</Text>
        <Controller
          control={control}
          name="warehouse_name"
          rules={{ required: 'Warehouse name is required' }}
          render={({ field: { onChange, value } }) => (
            <>
              <TouchableOpacity
                style={[styles.input, errors.warehouse_name && styles.errorInput]}
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

      {/* Brands List */}
      <FlatList
        data={fields}
        renderItem={renderBrandItem}
        keyExtractor={(item, index) => `brand-${index}`}
        scrollEnabled={false}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.addBrandButton}
            onPress={handleAddBrand}
          >
            <Icon name="add-circle" size={24} color={colors.success} />
            <Text style={styles.addBrandButtonText}>Add Another Brand</Text>
          </TouchableOpacity>
        }
      />

      <TouchableOpacity
        style={styles.submitButton}
        disabled={loading}
        onPress={handleSubmit(onSubmit)}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Add Stock</Text>
        )}
      </TouchableOpacity>

      {/* Warehouse Selection Modal */}
      <Modal
        visible={warehouseModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setWarehouseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Warehouse</Text>
            <TouchableOpacity
              onPress={() => setWarehouseModalVisible(false)}
            >
              <Icon name="close" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>
          
          {warehouseStatus === 'loading' ? <ActivityIndicator size={'large'} color={colors.primary}/> : <FlatList
            data={warehouseOptions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.warehouseItem}
                onPress={() => {
                  setValue('warehouse_name', item.warehouse_name);
                  setWarehouseModalVisible(false);
                }}
              >
                <Text style={styles.warehouseText}>{item.warehouse_name} ({item.liquor_type})</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />}
        </View>
      </Modal>

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
          {brandStatus == 'idle' ? <FlatList
            data={filteredBrands}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.brandItem}
                onPress={() => {
                  setValue(`brands.${currentBrandIndex}.brand_name`, item.brand_name);
                  setValue(`brands.${currentBrandIndex}.volume_ml`, item.volume_ml.toString());
                  setBrandModalVisible(false);
                  setSearchQuery('');
                }}
              >
                <Text style={styles.brandText}>{item.brand_name} ({item.volume_ml}ml)</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          /> : <ActivityIndicator size={'large'} color={colors.primary}/> }
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
    paddingBottom: 40,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.primary,
    textAlign: 'center',
  },
  header:{
    flexDirection: 'row',
    justifyContent:'space-between',
    alignItems:'center'
  },
  allStocksBtn:{
    marginBottom:15
  },
  allStocks:{
    color:colors.white,
    fontSize:14,
    backgroundColor:colors.primary,
    padding:4,
    borderRadius:8,
    fontWeight:'700'
  },
  fieldContainer: {
    marginBottom: 16,
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
  brandItemContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  brandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandNumber: {
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  removeBrandButton: {
    padding: 4,
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
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    height: 50,
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
  addBrandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 8,
    marginBottom: 20,
  },
  addBrandButtonText: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  warehouseItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
    backgroundColor: colors.white,
  },
  warehouseText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
});

export default PreviousStockIncrementForm;