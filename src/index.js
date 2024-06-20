import connectDb from './db/connectDb.js'
import dotenv from 'dotenv'

dotenv.config({
    path: './env',
})

connectDb()