import express from 'express'
import { addPayment } from '../controllers/paymentController.js'

const app = express.Router()


app.post('/', addPayment)




export default app