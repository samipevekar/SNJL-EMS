import express from 'express'
import { addBrand, editBrand, getBrands, getSpecificBrand } from '../controllers/brandController.js'

const app = express.Router()


app.post('/', addBrand)
app.get('/', getBrands)
app.get('/one/:id', getSpecificBrand)
app.patch('/:id', editBrand)




export default app