import express from 'express'
import { addIndent, getIndent } from '../controllers/indentformationController.js'

const app = express.Router()


app.post('/', addIndent)
app.get('/', getIndent)




export default app