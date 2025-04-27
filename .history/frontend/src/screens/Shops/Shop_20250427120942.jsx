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
import { selectUser } from '../../redux/slice/authSlice'
import { ActivityIndicator } from 'react-native-paper'
import { ScrollView } from 'react-native-gesture-handler'

const Shop = () => {
  const dispatch = useDispatch()
  const shops = useSelector(selectShops)
  const user = useSelector(selectUser)
  const [shopExpenses, setShopExpenses] = useState({})
  const [shopSales, setShopSales] = useState({})

  useEffect(() => {
    dispatch(getAllShopsAsync())
  }, [])

  useEffect(() => {
    let filteredShops = shops

    if (user?.role === 'manager') {
      // Only include shops assigned to the manager
      filteredShops = shops.filter(shop => user.assigned_shops.includes(shop.shop_id))
    }

    if (filteredShops.length > 0) {
      filteredShops.forEach(shop => {
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
  }, [shops, user])

  const visibleShops = user?.role === 'manager'
    ? shops.filter(shop => user.assigned_shops.includes(shop.shop_id))
    : shops

  if (visibleShops.length === 0) {
    return (
      <ActivityIndicator 
        size={'small'} 
        color={colors.primary} 
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} 
      />
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.heading}>Shops</Text>
        {visibleShops.map((shop) => (
          <ShopCard 
            key={shop.shop_id} 
            shop_name={shop.shop_name} 
            expense={(shopExpenses[shop.shop_id] || 0).toString()}
            sale={(shopSales[shop.shop_id] || 0).toString()} 
            shop_id={shop.shop_id} 
          />
        ))}
      </ScrollView>
    </View>
  )
}

export default Shop

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
