import React, {useState, useEffect} from 'react';
import {useForm, useFieldArray, Controller} from 'react-hook-form';
import {useDispatch, useSelector} from 'react-redux';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {selectUser} from '../../redux/slice/authSlice';
import {
  selectIndentStatus,
  addIndentAsync,
  resetIndentState,
  selectIndentData,
  selectIndentError,
} from '../../redux/slice/indentSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';

const IndentFormation = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const indentStatus = useSelector(selectIndentStatus);
  const indentData = useSelector(selectIndentData);
  const error = useSelector(selectIndentError);

  const [brandOptions] = useState([
    {id: 1, name: 'Whiskey ABC'},
    {id: 2, name: 'Rum XYZ'},
    {id: 3, name: 'Vodka DEF'},
    {id: 4, name: 'Gin GHI'},
  ]);
  const [shopIdLocked, setShopIdLocked] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const {
    control,
    handleSubmit,
    formState: {errors},
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      shop_id: user?.shop_id || '',
      brand: [{brand_name: '', cases: '0', duty: '0', cost_price: '0'}],
    },
  });

  const {fields, append, remove} = useFieldArray({
    control,
    name: 'brand',
  });

  const watchBrands = watch('brand');
  const shopId = watch('shop_id');

  const onSubmit = data => {
    const formattedData = {
      ...data,
      brand: data.brand.map(item => ({
        brand_name: item.brand_name,
        cases: Number(item.cases) || 0,
        duty: Number(item.duty) || 0,
        cost_price: Number(item.cost_price) || 0,
      })),
    };
  
    dispatch(addIndentAsync(formattedData));
  };

  useEffect(() => {
    if (indentStatus === 'succeeded') {
      Alert.alert('Success', 'Indent added successfully!');
      setShowPreview(true);
  
      setTimeout(() => {
        dispatch(resetIndentState());
      }, 3000);
    } else if (indentStatus === 'failed') {
      Alert.alert('Error', error || 'Failed to add indent');
    }
  }, [indentStatus, dispatch, error]);
  

  const totalCases = watchBrands?.reduce(
    (sum, item) => sum + (Number(item.cases) || 0),
    0,
  );
  const totalDuty = watchBrands?.reduce(
    (sum, item) => sum + (Number(item.duty) || 0),
    0,
  );
  const totalCostPrice = watchBrands?.reduce(
    (sum, item) => sum + (Number(item.cost_price) || 0),
    0,
  );

  const handleAddBrand = () => {
    append({brand_name: '', cases: '0', duty: '0', cost_price: '0'});
  };

  const handleRemoveAllBrands = () => {
    setValue('brand', [
      {brand_name: '', cases: '0', duty: '0', cost_price: '0'},
    ]);
    setShopIdLocked(false);
    setShowPreview(false);
  };

  const generatePDF = async () => {
    const htmlContent = `
      <div style="padding: 24px; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="text-align:center;">Indent Summary</h1>
        <p><strong>Shop ID:</strong> ${shopId}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
        <table style="width:100%; border-collapse:collapse; margin-top: 20px;" border="1">
          <thead>
            <tr>
              <th style="padding: 8px;">Brand</th>
              <th style="padding: 8px;">Cases</th>
              <th style="padding: 8px;">Duty</th>
              <th style="padding: 8px;">Cost Price</th>
            </tr>
          </thead>
          <tbody>
            ${watchBrands
              .map(
                item => `
                  <tr>
                    <td style="padding: 8px;">${item.brand_name}</td>
                    <td style="padding: 8px;">${item.cases}</td>
                    <td style="padding: 8px;">${item.duty}</td>
                    <td style="padding: 8px;">${item.cost_price}</td>
                  </tr>
                `
              )
              .join('')}
            <tr>
              <td style="padding: 8px;"><strong>Total</strong></td>
              <td style="padding: 8px;"><strong>${totalCases}</strong></td>
              <td style="padding: 8px;"><strong>${totalDuty}</strong></td>
              <td style="padding: 8px;"><strong>${totalCostPrice}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  
    try {
      const options = {
        html: htmlContent,
        fileName: `Indent_${shopId}_${Date.now()}`,
        directory: 'Documents',
      };
  
      const file = await RNHTMLtoPDF.convert(options);
      await Share.open({
        url: `file://${file.filePath}`,
        type: 'application/pdf',
        title: 'Share Indent PDF',
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to export PDF');
      console.error(err);
    }
  };

  const renderBrandItem = ({item, index}) => (
    <View style={styles.brandItemContainer}>
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Brand Name</Text>
          <Controller
            name={`brand.${index}.brand_name`}
            control={control}
            rules={{required: 'Brand name is required'}}
            render={({field: {onChange, value}}) => (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={value}
                  onValueChange={onChange}
                  style={styles.picker}
                  dropdownIconColor="#495057"
                  mode="dropdown">
                  <Picker.Item label="Select Brand" value="" />
                  {brandOptions.map(brand => (
                    <Picker.Item
                      key={brand.id}
                      label={brand.name}
                      value={brand.name}
                    />
                  ))}
                </Picker>
              </View>
            )}
          />
          {errors.brand?.[index]?.brand_name && (
            <Text style={styles.errorText}>
              {errors.brand[index].brand_name.message}
            </Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Cases</Text>
          <Controller
            name={`brand.${index}.cases`}
            control={control}
            rules={{
              required: 'Cases is required',
              min: {value: 1, message: 'Must be at least 1'},
            }}
            render={({field: {onChange, value}}) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder="0"
              />
            )}
          />
          {errors.brand?.[index]?.cases && (
            <Text style={styles.errorText}>
              {errors.brand[index].cases.message}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Duty</Text>
          <Controller
            name={`brand.${index}.duty`}
            control={control}
            rules={{
              required: 'Duty is required',
              min: {value: 0, message: 'Must be 0 or more'},
            }}
            render={({field: {onChange, value}}) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder="0"
              />
            )}
          />
          {errors.brand?.[index]?.duty && (
            <Text style={styles.errorText}>
              {errors.brand[index].duty.message}
            </Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Cost Price</Text>
          <Controller
            name={`brand.${index}.cost_price`}
            control={control}
            rules={{
              required: 'Cost price is required',
              min: {value: 0, message: 'Must be 0 or more'},
            }}
            render={({field: {onChange, value}}) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder="0"
              />
            )}
          />
          {errors.brand?.[index]?.cost_price && (
            <Text style={styles.errorText}>
              {errors.brand[index].cost_price.message}
            </Text>
          )}
        </View>
      </View>

      {index > 0 && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => remove(index)}>
          <Icon name="remove-circle" size={24} color="#d9534f" />
          <Text style={styles.removeButtonText}>Remove Brand</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.header}>Add New Indent</Text>

      <View style={styles.shopIdContainer}>
        <Text style={styles.label}>Shop ID</Text>
        <Controller
          name="shop_id"
          control={control}
          render={({field: {onChange, value}}) => (
            <TextInput
              style={[styles.input, shopIdLocked && styles.disabledInput]}
              value={value}
              onChangeText={onChange}
              editable={!shopIdLocked}
              placeholder="Enter Shop ID"
            />
          )}
        />
      </View>

      <Text style={styles.sectionHeader}>Brand Information</Text>

      <FlatList
        data={fields}
        renderItem={renderBrandItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleAddBrand}>
          <Icon name="add-circle" size={24} color="#28a745" />
          <Text style={styles.secondaryButtonText}>Add Brand</Text>
        </TouchableOpacity>

        {fields.length > 1 && (
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleRemoveAllBrands}>
            <Icon name="delete" size={24} color="#d9534f" />
            <Text style={styles.dangerButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit(onSubmit)}
        disabled={indentStatus === 'loading'}>
        <Text style={styles.submitButtonText}>
          {indentStatus === 'loading' ? 'Submitting...' : 'Submit Indent'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showPreview}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPreview(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Indent Preview</Text>
              <Pressable onPress={() => setShowPreview(false)}>
                <Icon name="close" size={24} color="#495057" />
              </Pressable>
            </View>

            <ScrollView style={styles.previewScroll}>
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>
                  Shop ID: <Text style={styles.previewValue}>{shopId}</Text>
                </Text>
                <Text style={styles.previewLabel}>
                  Date:{' '}
                  <Text style={styles.previewValue}>
                    {new Date().toLocaleDateString('en-GB')}
                  </Text>
                </Text>
              </View>

              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableHeaderText, styles.brandCol]}>
                    Brand
                  </Text>
                  <Text style={styles.tableHeaderText}>Cases</Text>
                  <Text style={styles.tableHeaderText}>Duty</Text>
                  <Text style={styles.tableHeaderText}>Cost Price</Text>
                </View>

                {watchBrands.map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.brandCol]}>
                      {item.brand_name || '-'}
                    </Text>
                    <Text style={styles.tableCell}>{item.cases || '0'}</Text>
                    <Text style={styles.tableCell}>{item.duty || '0'}</Text>
                    <Text style={styles.tableCell}>
                      {item.cost_price || '0'}
                    </Text>
                  </View>
                ))}

                <View style={[styles.tableRow, styles.tableFooter]}>
                  <Text style={[styles.tableFooterText, styles.brandCol]}>
                    Total
                  </Text>
                  <Text style={styles.tableFooterText}>{totalCases}</Text>
                  <Text style={styles.tableFooterText}>{totalDuty}</Text>
                  <Text style={styles.tableFooterText}>{totalCostPrice}</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, {marginBottom: 10}]}
                onPress={generatePDF}>
                <Text style={styles.modalButtonText}>Export as PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowPreview(false)}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 20,
    textAlign: 'center',
  },
  shopIdContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderColor: '#dee2e6',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#e9ecef',
    color: '#495057',
  },
  pickerContainer: {
    borderColor: '#dee2e6',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  brandItemContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inputContainer: {
    flex: 1,
    marginRight: 10,
  },
  errorText: {
    color: '#d9534f',
    fontSize: 12,
    marginTop: 5,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  removeButtonText: {
    color: '#d9534f',
    marginLeft: 5,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 5,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#28a745',
    flex: 1,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#28a745',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9534f',
    flex: 1,
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: '#d9534f',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#495057',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#495057',
  },
  previewScroll: {
    paddingHorizontal: 15,
  },
  previewSection: {
    marginVertical: 15,
  },
  previewLabel: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 5,
    fontWeight: '500',
  },
  previewValue: {
    fontWeight: 'normal',
  },
  table: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#dee2e6',
    padding: 12,
  },
  tableHeader: {
    backgroundColor: '#e9ecef',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  brandCol: {
    flex: 2,
    textAlign: 'left',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
  },
  tableFooter: {
    backgroundColor: '#e9ecef',
  },
  tableFooterText: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  modalFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  modalButton: {
    backgroundColor: '#495057',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default IndentFormation;
