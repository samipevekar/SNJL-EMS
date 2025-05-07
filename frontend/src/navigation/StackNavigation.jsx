import { createStackNavigator } from '@react-navigation/stack';
import FaceRecongnitionAttendance from '../screens/Attendance/FaceRecongnitionAttendance';
import Home from '../screens/Home/Home';
import Login from '../screens/Auth/Login';
import AuthCheck from '../Helpers/AuthCheck';
import TabNavigation from './TabNavigation';
import ShopDetails from '../screens/Shops/ShopDetails';
import AttendanceDetails from '../screens/Attendance/AttendanceDetails';
import BalanceSheetPage from '../screens/Accounting/BalanceSheetPage';
import IndentFormation from '../screens/IndentFormation/IndentFormation';
import ExpenseForm from '../screens/Expense/ExpenseForm';
import WarehousePaymentPage from '../screens/WarehousePayment/WarehousePaymentForm';
import SaleSheetDetails from '../screens/SaleSheet/SaleSheetDetails';
import SaleSheetsPage from '../screens/SaleSheet/SaleSheetPage';
import StockIncrementForm from '../screens/SaleSheet/StockIncrementForm';
import ShopSaleSheets from '../screens/Shops/ShopSaleSheets';
import UserManagement from '../screens/Auth/UserManagement';
import ShopManagement from '../screens/Shops/ShopManagement';
import PreviousRecordSalePage from '../screens/SaleSheet/PreviousRecordSalePage';
import PreviousStockIncrementForm from '../screens/SaleSheet/PreviousStockIncrementForm';
import BrandManagement from '../screens/Brands/BrandManagement';
import BrandDetail from '../screens/Brands/BrandDetail';
import AllStockPage from '../screens/SaleSheet/AllStockPage';
import PreviousAllStockPage from '../screens/SaleSheet/PreviousAllStockPage';

const Stack = createStackNavigator();

export default function StackNavigation() {
  return (
    <Stack.Navigator initialRouteName='CheckAuth' screenOptions={{headerShown:false}}>
      <Stack.Screen name='CheckAuth' component={AuthCheck}/>
      <Stack.Screen name="Login" component={Login}  />
      <Stack.Screen name="UserManagementPage" component={UserManagement}  />      
      <Stack.Screen name="Main" component={TabNavigation}  />
      <Stack.Screen name="Attendance" component={FaceRecongnitionAttendance}  />
      <Stack.Screen name="ShopDetails" component={ShopDetails}  />
      <Stack.Screen name="ShopSaleSheets" component={ShopSaleSheets}  />
      <Stack.Screen name="ShopManagementPage" component={ShopManagement}  />
      <Stack.Screen name="AttendanceDetails" component={AttendanceDetails}  />
      <Stack.Screen name="BalanceSheetPage" component={BalanceSheetPage}  />
      <Stack.Screen name="IndentFormationPage" component={IndentFormation}  />
      <Stack.Screen name="AddExpensePage" component={ExpenseForm}  />
      <Stack.Screen name="AddWarehousePaymentPage" component={WarehousePaymentPage}  />
      <Stack.Screen name="StockIncrementForm" component={StockIncrementForm}  />
      <Stack.Screen name="AllStockPage" component={AllStockPage}  />
      <Stack.Screen name="SaleSheetDetails" component={SaleSheetDetails}  />
      <Stack.Screen name="SaleSheetPage" component={SaleSheetsPage}  />
      <Stack.Screen name="PreviousRecordSalePage" component={PreviousRecordSalePage}  />
      <Stack.Screen name="PreviousStockIncrementForm" component={PreviousStockIncrementForm}  />
      <Stack.Screen name="PreviousAllStockPage" component={PreviousAllStockPage}  />
      <Stack.Screen name="BrandManagement" component={BrandManagement}  />
      <Stack.Screen name="BrandDetail" component={BrandDetail}  />
    </Stack.Navigator>
  );
}