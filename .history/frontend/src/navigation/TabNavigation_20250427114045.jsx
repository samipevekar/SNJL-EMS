import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/Home/Home';
import Shop from '../screens/Shops/Shop';
import AccoutingPage from '../screens/Accounting/AccoutingPage';

const Tab = createBottomTabNavigator();

export default function TabNavigation() {
  return (
    <Tab.Navigator screenOptions={{headerShown:false}}>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Shops" component={Shop} />
      <Tab.Screen name="Accouting" component={AccoutingPage} />
    </Tab.Navigator>
  );
}
