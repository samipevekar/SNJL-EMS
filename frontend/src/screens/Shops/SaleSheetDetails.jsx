import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import SaleSheetTable from '../../components/SaleSheetTable'
import ExpensesTable from '../../components/ExpensesTable'
import COLORS from '../../theme/colors'  // Import colors

const SaleSheetDetails = () => {
    return (
        <ScrollView 
            style={styles.container} 
            nestedScrollEnabled={true}  // Allow nested scrolling
            keyboardShouldPersistTaps="handled" // Ensures taps work properly
        >
            <View style={styles.content}>
                <Text style={styles.heading}>Sale Sheets</Text>
                <SaleSheetTable
                    data={[
                        { brand: 'Brand A', ob: 100, mrp: 50, sale: 10, increment: 50, closingBal: 90, saleAmount: 500 },
                        { brand: 'Brand B', ob: 90, mrp: 50, sale: 10, increment: 50, closingBal: 100, saleAmount: 500 },
                        { brand: 'Brand C', ob: 100, mrp: 50, sale: 10, increment: 50, closingBal: 90, saleAmount: 500 },
                    ]}
                    selectedVolume="All"
                    onVolumeChange={(value) => console.log(value)}
                />

                <Text style={styles.heading}>Expenses</Text>
                <ExpensesTable 
                    expenses={[
                        { label: 'Expense A', value: 300 },
                        { label: 'Expense B', value: 400 },
                        { label: 'Expense C', value: 400 },
                        { label: 'Expense D', value: 400 },
                    ]} 
                />
            </View>
        </ScrollView>
    )
}

export default SaleSheetDetails

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,  // Use theme background color
    },
    content: {
        paddingHorizontal: 10,
        paddingBottom: 20,
    },
    heading: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 10,
        marginTop: 20,
        color: COLORS.primary,  // Use theme primary color
    },
});
