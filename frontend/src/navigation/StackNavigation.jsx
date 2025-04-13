import { createStackNavigator } from '@react-navigation/stack';
import FaceRecongnitionAttendance from '../screens/Attendance/FaceRecongnitionAttendance';
import Home from '../screens/Home/Home';
import Login from '../screens/Auth/Login';
import AuthCheck from '../Helpers/AuthCheck';
import TabNavigation from './TabNavigation';
import ShopDetails from '../screens/Shops/ShopDetails';
import SalesTable from '../screens/Shops/SaleSheetDetails';
import AttendanceDetails from '../screens/Attendance/AttendanceDetails';
import BalanceSheetPage from '../screens/Accounting/BalanceSheetPage';
import IndentFormation from '../screens/IndentFormation/IndentFormation';
import ExpenseForm from '../screens/Expense/ExpenseForm';
import WarehousePaymentPage from '../screens/WarehousePayment/WarehousePaymentForm';

const Stack = createStackNavigator();

export default function StackNavigation() {
  return (
    <Stack.Navigator initialRouteName='CheckAuth' screenOptions={{headerShown:false}}>
      <Stack.Screen name='CheckAuth' component={AuthCheck}/>
      <Stack.Screen name="Login" component={Login}  />
      {/* <Stack.Screen name="Home" component={Home}  /> */}
      <Stack.Screen name="Main" component={TabNavigation}  />
      <Stack.Screen name="Attendance" component={FaceRecongnitionAttendance}  />
      <Stack.Screen name="ShopDetails" component={ShopDetails}  />
      <Stack.Screen name="SaleSheetsDetails" component={SalesTable}  />
      <Stack.Screen name="AttendanceDetails" component={AttendanceDetails}  />
      <Stack.Screen name="BalanceSheetPage" component={BalanceSheetPage}  />
      <Stack.Screen name="IndentFormationPage" component={IndentFormation}  />
      <Stack.Screen name="AddExpensePage" component={ExpenseForm}  />
      <Stack.Screen name="AddWarehousePaymentPage" component={WarehousePaymentPage}  />
    </Stack.Navigator>
  );
}