import {configureStore} from '@reduxjs/toolkit'
import authSlice from '../slice/authSlice'
import shopSlice from '../slice/shopSlice'
import balanceSheetSlice from '../slice/balanceSheetSlice'
import indentSlice from '../slice/indentSlice'
import expenseSlice from '../slice/expenseSlice'
import warehousePaymentSlice from '../slice/warehousePaymentSlice'
import saleSheetSlice from '../slice/saleSheetSlice'
import brandSlice from '../slice/brandSlice'
import stockIncrementSlice from '../slice/stockIncrementSlice'
import attendanceSlice from '../slice/attendanceSlice'

export const store = configureStore({
    reducer: {
        auth: authSlice,
        shop: shopSlice,
        balanceSheet: balanceSheetSlice,
        indent: indentSlice,
        expense: expenseSlice,
        payment: warehousePaymentSlice,
        saleSheet: saleSheetSlice,
        brand: brandSlice,
        stockIncrement: stockIncrementSlice,
        attendance: attendanceSlice
    }
})
