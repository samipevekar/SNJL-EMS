import express from 'express'
import { addBrand, getBrands } from '../controllers/brandController.js'

const app = express.Router()


app.post('/', addBrand)
app.get('/', getBrands)




export default app