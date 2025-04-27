import { Button, StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import { getToken, removeToken } from '../../storage/AuthStorage'
import { useDispatch, useSelector } from 'react-redux'
import { getMeAsync, selectUser } from '../../redux/slice/authSlice'

const Home = () => {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  // async function token(){
  //   const token = await getToken()
  //   console.log(token)
  // }
  // token()

  useEffect(()=>{
    dispatch(getMeAsync())
    console.log("user detail", user)
  },[])

  const navigation = useNavigation()
  return (
    <View style={styles.container}>
      <Text>Home</Text>
      <Text>{user?.name}</Text>
      <Text>{user?.email}</Text>
      <Button title='Attendance' onPress={()=>navigation.navigate("Attendance")}></Button>
      <Button title='Logout' onPress={()=>{removeToken();navigation.replace("Login");}}></Button>
      <Button title='Indent Formation' onPress={()=>navigation.navigate("IndentFormationPage")}></Button>
      <Button title='Add Expense' onPress={()=>navigation.navigate("AddExpensePage")}></Button>
      <Button title='Add Warehouse Payment' onPress={()=>navigation.navigate("AddWarehousePaymentPage")}></Button>
    </View>
  )
}

export default Home

const styles = StyleSheet.create({
    container:{
        flex:1
    }
})