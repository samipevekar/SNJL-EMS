import express from 'express'
import { addExpenseToSaleSheet, createSaleSheet, dailyNetCashForBeerLiquor, dailyNetCashForCountryLiquor, dailyNetCashForForeignLiquor, deleteSaleSheet, getAccountingData, getSaleSheetByShopId, getSpecificSaleSheet, updateSaleSheet } from '../controllers/saleSheetController.js'
import { checkAuth } from '../middleware/authMiddleware.js'

const app = express.Router()


app.post('/create', createSaleSheet)
app.patch('/update/:id', updateSaleSheet)
app.get('/accouting-data',checkAuth, getAccountingData)
app.delete('/:id', deleteSaleSheet)
app.get('/:id',getSpecificSaleSheet)
app.get('/sheets/:shop_id',getSaleSheetByShopId)
app.patch('/:shop_id', addExpenseToSaleSheet)
app.post('/country/sales', dailyNetCashForCountryLiquor)
app.post('/foreign/sales', dailyNetCashForForeignLiquor)
app.post('/beer/sales', dailyNetCashForBeerLiquor)




export default app