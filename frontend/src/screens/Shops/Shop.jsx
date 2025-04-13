import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import ShopCard from '../../components/ShopCard'
import colors from '../../theme/colors'
import { useDispatch, useSelector } from 'react-redux'
import { 
  getAllExpenseAsync, 
  getAllShopsAsync, 
  getLatestSaleSheetAsync, 
  selectShops 
} from '../../redux/slice/shopSlice'
import { ActivityIndicator } from 'react-native-paper'

const Shop = () => {
  const shops = useSelector(selectShops)
  const [shopExpenses, setShopExpenses] = useState({})
  const [shopSales, setShopSales] = useState({})
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(getAllShopsAsync())
  }, [])

  useEffect(() => {
    if (shops && shops.length > 0) {
      shops.forEach(shop => {
        // Expenses
        dispatch(getAllExpenseAsync({ shop_id: shop.shop_id }))
          .then((action) => {
            if (action.payload) {
              setShopExpenses(prev => ({
                ...prev,
                [shop.shop_id]: action.payload.latestTotalExpense || 0
              }))
            }
          });

        // Sales
        dispatch(getLatestSaleSheetAsync(shop.shop_id))
          .then((action) => {
            if (action.payload) {
              setShopSales(prev => ({
                ...prev,
                [shop.shop_id]: action.payload.daily_sale || 0
              }))
            }
          });
      });
    }
  }, [shops])

  if (shops.length == 0) {
    return <ActivityIndicator size={'small'} color={colors.primary} style={{ margin: 'auto' }} />
  }

  return (
    <View style={styles.container} >
      <Text style={styles.heading}>Shops</Text>
      {shops.map((shop) => (
        <ShopCard 
          key={shop.shop_id} 
          shop_name={shop.shop_name} 
          expense={(shopExpenses[shop.shop_id] || 0).toString()}
          sale={(shopSales[shop.shop_id] || 0).toString()} 
          shop_id={shop.shop_id} 
        />
      ))}
    </View>
  )
}

export default Shop

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: colors.background
    },
    heading: {
      fontSize: 25,
      fontWeight: 'bold',
      marginBottom: 10,
      marginTop: 10,
      textAlign: 'center'
    }
})
