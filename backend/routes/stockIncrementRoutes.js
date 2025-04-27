import express from 'express'
import { addStockIncrement, getStockIncrementBrands, updateStockIncrement } from '../controllers/stockIncrementController.js'

const app = express.Router()


app.post('/', addStockIncrement)
app.patch('/:id', updateStockIncrement)
app.get('/:shop_id', getStockIncrementBrands)



export default app