import { StyleSheet, Text, View, ScrollView } from 'react-native'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSaleSheetsAsync, selectSaleSheets, selectSaleSheetsLoading } from '../../redux/slice/saleSheetSlice'
import SaleSheetCard from '../../components/SaleSheetCard'
import colors from '../../theme/colors'
import { formatDateLeft } from '../../utils/formatDateLeft'
import { getAllExpenseAsync, selectShopExpenses } from '../../redux/slice/shopSlice'
import ExpensesTable from '../../components/ExpensesTable'
import { ActivityIndicator } from 'react-native-paper'

const ShopSaleSheets = ({route}) => {
    const { shop_id, sale_date } = route.params
    const dispatch = useDispatch()
    const saleSheets = useSelector(selectSaleSheets)
    const shopExpenses = useSelector(selectShopExpenses)
    const loading = useSelector(selectSaleSheetsLoading)

    useEffect(() => {
        dispatch(fetchSaleSheetsAsync({shop_id, sale_date}))
        dispatch(getAllExpenseAsync({shop_id,sale_date}))
    }, [shop_id, sale_date, dispatch])

    const getCumulativeTotals = () => {
        let net_cash = 0;
        let cash_in_hand = 0;
        let upi = 0;
        let total_expenses = 0;
        let canteen = 0;
        let net_sale = 0;
      
        saleSheets.forEach(sheet => {
          net_cash += Number(sheet.net_cash || 0);
          cash_in_hand += Number(sheet.cash_in_hand || 0);
          upi += Number(sheet.upi || 0);
          canteen += Number(sheet.canteen || 0)
          net_sale += Number(sheet.daily_sale || 0)
      
          // Sum of all expenses per sheet
          if (Array.isArray(sheet.expenses)) {
            sheet.expenses.forEach(expense => {
              total_expenses += Number(expense.amount || 0);
            });
          }
        });
      
        return {
          net_cash,
          cash_in_hand,
          upi,
          total_expenses,
          canteen,
          net_sale
        };
      };
      
      const { net_cash, cash_in_hand, upi, total_expenses, canteen, net_sale } = getCumulativeTotals();

      if(loading){
        return (
            <ActivityIndicator size={'large'} color={colors.primary} style={styles.ActivityIndicator} />
        )
      }
    

    return (
        <ScrollView style={styles.container}>
            {/* Enhanced Header Section */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Sale Details</Text>
                    <View style={styles.infoRow}>
                        <View style={styles.infoBadge}>
                            <Text style={styles.infoLabel}>SHOP ID</Text>
                            <Text style={styles.infoValue}>{shop_id}</Text>
                        </View>
                        <View style={styles.infoBadge}>
                            <Text style={styles.infoLabel}>DATE</Text>
                            <Text style={styles.infoValue}>{formatDateLeft(sale_date)}</Text>
                        </View>
                    </View>
                </View>
            </View>

             {/* Cumulative Summary */}
                  {saleSheets.length > 0 && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Cumulative Totals</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Net Sale:</Text>
                  <Text style={styles.summaryValue}>₹{net_sale.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Expenses:</Text>
                  <Text style={styles.summaryValue}>₹{total_expenses.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Canteen:</Text>
                  <Text style={styles.summaryValue}>₹{canteen.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Net Cash:</Text>
                  <Text style={styles.summaryValue}>₹{net_cash.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>UPI:</Text>
                  <Text style={styles.summaryValue}>₹{upi.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Cash Collected:</Text>
                  <Text style={styles.summaryValue}>₹{cash_in_hand.toFixed(2)}</Text>
                </View>
              </View>
            )}

            

            {saleSheets.length > 0 ? (
                <View style={styles.scrollContainer}>
                    <Text style={[styles.secondaryHeading,{marginLeft:10}]}>Sale Sheets:</Text>

                    {saleSheets.map((item, index) => (
                        <SaleSheetCard 
                            key={index} 
                            item={item} 
                            showDate={false}
                        />
                    ))}
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No sale records found for this date</Text>
                </View>
            )}

            {/* Expenses table */}
            <View style={styles.shopExpenses}>
                <Text style={styles.secondaryHeading}>Shop Expenses:</Text>
                <ExpensesTable expenses={shopExpenses} />
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.primary,
        paddingVertical: 20,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    headerContent: {
        maxWidth: '100%',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.white,
        marginBottom: 15,
        letterSpacing: 1,
        textAlign:'center'
    },
    secondaryHeading:{
        fontWeight: 'bold',
        fontSize:16,
        marginTop:10
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    infoBadge: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    infoLabel: {
        fontSize: 12,
        color: colors.white,
        opacity: 0.8,
        marginBottom: 2,
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 16,
        color: colors.white,
        fontWeight: '700',
    },
    scrollContainer: {
        padding: 5,
        paddingTop: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: colors.grayDark,
        textAlign: 'center',
    },
    shopExpenses:{
        paddingHorizontal:15,
        marginBottom:10
    },
    summaryContainer: {
        backgroundColor: colors.white,
        padding: 16,
        margin: 15,
        borderRadius: 8,
        shadowColor: colors.black,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
        // elevation: 2,
      },
      summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: colors.textDark,
      },
      summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 4,
      },
      summaryLabel: {
        fontSize: 16,
        color: colors.primary,
      },
      summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textDark,
      },
      ActivityIndicator:{
        margin:'auto'
      }
})

export default ShopSaleSheets