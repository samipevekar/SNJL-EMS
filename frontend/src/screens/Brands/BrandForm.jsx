// src/components/Brand/BrandForm.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import colors from '../../theme/colors';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ActivityIndicator } from 'react-native-paper';

const BrandForm = ({ initialData, onSubmit, loading, onCancel }) => {
    const [formData, setFormData] = useState({
        brand_name: '',
        liquor_type: 'country',
        category: '',
        packaging_type: '',
        volume_ml: '',
        pieces_per_case: '',
        cost_price_per_case: '',
        mrp_per_unit: '',
        duty: ''
    });

    const [showAdditionalFields, setShowAdditionalFields] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                brand_name: initialData.brand_name || '',
                liquor_type: initialData.liquor_type || 'country',
                category: initialData.category || '',
                packaging_type: initialData.packaging_type || '',
                volume_ml: initialData.volume_ml?.toString() || '',
                pieces_per_case: initialData.pieces_per_case?.toString() || '',
                cost_price_per_case: initialData.cost_price_per_case?.toString() || '',
                mrp_per_unit: initialData.mrp_per_unit?.toString() || '',
                duty: initialData.duty?.toString() || ''
            });
            if (initialData.liquor_type === 'foreign') {
                setShowAdditionalFields(true);
            }
        }
    }, [initialData]);

    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'liquor_type' && value === 'foreign') {
            setShowAdditionalFields(true);
        } else if (name === 'liquor_type' && value === 'country') {
            setShowAdditionalFields(false);
            setFormData(prev => ({
                ...prev,
                category: '',
                packaging_type: '',
                volume_ml: '',
                pieces_per_case: '',
                cost_price_per_case: '',
                mrp_per_unit: '',
                duty: ''
            }));
        }
    };

    const handleSubmit = () => {
        const numericFields = ['volume_ml', 'pieces_per_case', 'cost_price_per_case', 'mrp_per_unit', 'duty'];
        const processedData = { ...formData };

        numericFields.forEach(field => {
            if (processedData[field]) {
                processedData[field] = parseFloat(processedData[field]);
            }
        });

        onSubmit(processedData);
    };

    const isCountryLiquor = formData.liquor_type === 'country';
    const isForeignLiquor = formData.liquor_type === 'foreign';

    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={onCancel} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.formTitle}>{initialData ? 'Edit Brand' : 'Add New Brand'}</Text>
                <View style={styles.headerRightPlaceholder} />
            </View>

            <View style={styles.card}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Brand Name*</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.brand_name}
                        onChangeText={(text) => handleChange('brand_name', text)}
                        placeholder="Enter brand name"
                        placeholderTextColor={colors.grayDark}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Liquor Type*</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={formData.liquor_type}
                            onValueChange={(value) => handleChange('liquor_type', value)}
                            style={styles.picker}
                            dropdownIconColor={colors.primary}
                        >
                            <Picker.Item label="Country Liquor" value="country" />
                            <Picker.Item label="Foreign Liquor" value="foreign" />
                        </Picker>
                    </View>
                </View>

                {isCountryLiquor && !showAdditionalFields && (
                    <TouchableOpacity 
                        style={styles.addFieldsButton}
                        onPress={() => setShowAdditionalFields(true)}
                    >
                        <Text style={styles.addFieldsButtonText}>+ Add Custom Details</Text>
                    </TouchableOpacity>
                )}

                {(showAdditionalFields || isForeignLiquor) && (
                    <>
                        {isForeignLiquor && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Category*</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.category}
                                    onChangeText={(text) => handleChange('category', text)}
                                    placeholder="Enter category (e.g., Scotch, Vodka)"
                                    placeholderTextColor={colors.grayDark}
                                />
                            </View>
                        )}

                        {!isCountryLiquor && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Packaging Type</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.packaging_type}
                                    onChangeText={(text) => handleChange('packaging_type', text)}
                                    placeholder="Enter packaging type (e.g., Bottle, Can)"
                                    placeholderTextColor={colors.grayDark}
                                />
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Volume (ml){isForeignLiquor && '*'}</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.volume_ml}
                                onChangeText={(text) => handleChange('volume_ml', text)}
                                placeholder="Enter volume in ml"
                                placeholderTextColor={colors.grayDark}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Pieces per Case{isForeignLiquor && '*'}</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.pieces_per_case}
                                onChangeText={(text) => handleChange('pieces_per_case', text)}
                                placeholder="Enter pieces per case"
                                placeholderTextColor={colors.grayDark}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Cost Price per Case{isForeignLiquor && '*'}</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.cost_price_per_case}
                                onChangeText={(text) => handleChange('cost_price_per_case', text)}
                                placeholder="Enter cost price"
                                placeholderTextColor={colors.grayDark}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>MRP per Unit{isForeignLiquor && '*'}</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.mrp_per_unit}
                                onChangeText={(text) => handleChange('mrp_per_unit', text)}
                                placeholder="Enter MRP per unit"
                                placeholderTextColor={colors.grayDark}
                                keyboardType="numeric"
                            />
                        </View>

                        {!isCountryLiquor && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Duty</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.duty}
                                    onChangeText={(text) => handleChange('duty', text)}
                                    placeholder="Enter duty amount"
                                    placeholderTextColor={colors.grayDark}
                                    keyboardType="numeric"
                                />
                            </View>
                        )}
                    </>
                )}
            </View>

            <View style={styles.buttonGroup}>
                <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]}
                    onPress={onCancel}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[
                        styles.button, 
                        styles.submitButton,
                        (!formData.brand_name || (isForeignLiquor && !formData.category)) && styles.disabledButton
                    ]}
                    onPress={handleSubmit}
                    disabled={loading || !formData.brand_name || (isForeignLiquor && !formData.category)}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={styles.buttonText}>
                            {initialData ? 'Update Brand' : 'Add Brand'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContainer: {
        paddingBottom: 30,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.secondary,
        backgroundColor: colors.white,
    },
    backButton: {
        padding: 4,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
        textAlign: 'center',
        flex: 1,
    },
    headerRightPlaceholder: {
        width: 32,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 8,
        margin: 16,
        padding: 16
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: colors.textDark,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.secondary,
        borderRadius: 8,
        padding: Platform.OS === 'ios' ? 12 : 10,
        fontSize: 16,
        color: colors.textDark,
    },
    pickerContainer: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.secondary,
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: Platform.OS === 'ios' ? 160 : 55,
        width: '100%',
        color: colors.textDark,
    },
    addFieldsButton: {
        backgroundColor: colors.primary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 4,
    },
    addFieldsButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginTop: 8,
    },
    button: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 8,
    },
    submitButton: {
        backgroundColor: colors.primary,
    },
    cancelButton: {
        backgroundColor: colors.danger,
    },
    disabledButton: {
        backgroundColor: colors.grayDark,
        opacity: 0.7,
    },
    buttonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default BrandForm;