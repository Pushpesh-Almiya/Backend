// require ("dotenv").config({path:"./env"})
import dotenv from "dotenv"
import connectDB from './db/index.js';
import {app} from "./app.js"

dotenv.config({
    path :"./env"
})
connectDB()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`⚙️  Server is listening on Port : ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("MongoDB connection error : ", error);
})



// app.post("/api/v2/register",(req,res)=>{
//     res.status(200).json({
//        message:"ok" 
//     })
// })



/*
const app = express()
;(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("ERROR: ", error);
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on PORT ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR : ",error);
        throw error
    }
})()

*/