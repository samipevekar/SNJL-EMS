import express from 'express'
import { addExpense, updateExpense } from '../controllers/expenseController.js'

const app = express.Router()


app.post('/', addExpense)
app.patch('/:id', updateExpense)




export default app