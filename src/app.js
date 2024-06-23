import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { LIMIT } from './constants.js'

const app = express()
// to handle cross origin request services
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// to handle json data receiving from form, json file, etc
app.use(express.json({
    limit: LIMIT
}))

// to handle url requests
app.use(express.urlencoded({
    extended: true,
    limit: LIMIT
}))

// to handle images files for temporary in public folder
app.use(express.static("public"))

// to perform CURD operation on cookies
app.use(cookieParser())


// importing routes
import userRouter from './routes/user.routes.js'

// routes usage
app.use('/api/v1/users', userRouter)

export { app }