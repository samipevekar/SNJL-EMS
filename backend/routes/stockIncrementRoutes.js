import express from 'express'
import { addStockIncrement, deleteStockIncrement, getStockIncrementBrands, updateStockIncrement } from '../controllers/stockIncrementController.js'

const app = express.Router()


app.post('/', addStockIncrement)
app.patch('/:id', updateStockIncrement)
app.get('/:shop_id', getStockIncrementBrands)
app.delete('/:id', deleteStockIncrement)



export default app