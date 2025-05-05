// src/screens/Brand/BrandDetail.jsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute } from '@react-navigation/native';
import colors from '../../theme/colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { clearCurrentBrand, getSpecificBrandAsync, selectBrandsError, selectBrandsLoading, selectCurrentBrand } from '../../redux/slice/brandSlice';

const BrandDetail = ({ navigation,route }) => {
    const dispatch = useDispatch();
    const { id } = route.params;
    console.log(id)
    const brand = useSelector(selectCurrentBrand);
    const loading = useSelector(selectBrandsLoading);
    const error = useSelector(selectBrandsError);

    useEffect(() => {
        dispatch(getSpecificBrandAsync(id));

        return () => {
            dispatch(clearCurrentBrand());
        };
    }, [dispatch, id]);

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // if (error) {
    //     return (
    //         <View style={styles.centerContainer}>
    //             <Text style={styles.errorText}>{error}</Text>
    //         </View>
    //     );
    // }

    if (!brand) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>Brand not found</Text>
            </View>
        );
    }

    const isCountryLiquor = brand.liquor_type === 'country';
    const profit = brand.mrp_per_case - brand.cost_price_per_case;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>{brand.brand_name}</Text>
                <View style={styles.headerRightPlaceholder} />
            </View>

            <View style={styles.card}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>
                    <DetailRow label="Brand Name" value={brand.brand_name} />
                    <DetailRow label="Liquor Type" value={brand.liquor_type} capitalize />
                    {!isCountryLiquor && <DetailRow label="Category" value={brand.category} />}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Product Details</Text>
                    {!isCountryLiquor && <DetailRow label="Packaging Type" value={brand.packaging_type} />}
                    <DetailRow label="Volume" value={`${brand.volume_ml} ml`} />
                    <DetailRow label="Pieces per Case" value={brand.pieces_per_case} />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pricing</Text>
                    <DetailRow label="Cost Price per Case" value={`₹${brand.cost_price_per_case}`} />
                    <DetailRow label="MRP per Unit" value={`₹${brand.mrp_per_unit}`} />
                    <DetailRow label="MRP per Case" value={`₹${brand.mrp_per_case}`} />
                    <DetailRow label="Profit per Case" value={`₹${profit}`} />
                    {!isCountryLiquor && <DetailRow label="Duty" value={`₹${brand.duty}`} />}
                </View>
            </View>
        </ScrollView>
    );
};

const DetailRow = ({ label, value, capitalize = false }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text 
            style={styles.detailValue}
            numberOfLines={1} 
            ellipsizeMode="tail"
        >
            {capitalize ? value.charAt(0).toUpperCase() + value.slice(1) : value}
        </Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContainer: {
        paddingBottom: 20,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.secondary,
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
        flex: 1,
        textAlign: 'center',
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
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 12,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: colors.secondary,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 14,
        color: colors.textDark,
        fontWeight: '500',
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    errorText: {
        color: colors.danger,
        fontSize: 16,
        textAlign: 'center',
        padding: 20,
    },
    emptyText: {
        color: colors.textDark,
        fontSize: 16,
    },
});

export default BrandDetail;