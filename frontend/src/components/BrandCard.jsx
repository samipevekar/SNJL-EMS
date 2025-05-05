// src/components/Brand/BrandCard.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const BrandCard = ({ brand, onEdit }) => {

    const navigation = useNavigation()

    const handleBrandCardPress = () =>{
        navigation.navigate('BrandDetail', {id:brand?.id})
    }

    return (
        <TouchableOpacity onPress={handleBrandCardPress} style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.textContainer}>
                    <Text 
                        style={styles.brandName} 
                        // numberOfLines={1} 
                        // ellipsizeMode="tail"
                    >
                        {brand.brand_name}
                    </Text>
                    <Text style={styles.volumeText}>{brand.volume_ml}ml</Text>
                </View>
                <TouchableOpacity 
                    style={styles.editButton} 
                    onPress={() => onEdit(brand)}
                >
                    <Icon name="pencil" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginRight: 10,
    },
    brandName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 4,
    },
    volumeText: {
        fontSize: 14,
        color: colors.primary
    },
    editButton: {
        padding: 8,
    },
});

export default BrandCard;