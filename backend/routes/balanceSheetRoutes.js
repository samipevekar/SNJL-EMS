import express from 'express'
import { getShopBalanceSheet, getWarehouseBalanceSheet } from '../controllers/balanceSheetController.js'

const app = express.Router()


app.get('/shop', getShopBalanceSheet)
app.get('/warehouse', getWarehouseBalanceSheet)




export default app