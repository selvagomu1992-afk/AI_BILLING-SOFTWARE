import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import { createInvoice, deleteInvoice, getInvoice, getInvoiceById, updateInvoice } from '../Controlllers/InvoiceController.js';


const InvoiceRouter = express.Router()
InvoiceRouter.use(clerkMiddleware())

InvoiceRouter.get('/', getInvoice)
InvoiceRouter.get('/:id', getInvoiceById)
InvoiceRouter.post('/', createInvoice)
InvoiceRouter.put('/:id', updateInvoice)
InvoiceRouter.delete('/:id', deleteInvoice)

export default InvoiceRouter