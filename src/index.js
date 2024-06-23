import connectDb from './db/connectDb.js'
import dotenv from 'dotenv'
import { app } from './app.js'

dotenv.config({
    path: './.env',
})

connectDb().then(() => {
    app.on("error", (error) => {
        console.error(error);
    })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT}`)
    })
}).catch((error) => {
    console.log("MongoDB connection failed !! ",error)
})