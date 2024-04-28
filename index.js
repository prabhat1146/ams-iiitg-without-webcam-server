

const express=require("express")

const app=express()
const dotenv=require("dotenv").config();
const cors=require("cors")
const port=process.env.PORT || 5000


app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cors())
app.use("/verification",require("./routes/emailVerification.js"))
app.use("/admin",require("./routes/adminRouter.js"))
app.use("/api/admin",require("./routes/adminRouterAPI.js"))
app.use("/faculty",require("./routes/facultyRouter.js"))
app.use("/course",require("./routes/courseRouter.js"))
app.use("/student",require("./routes/studentRouter.js"))
app.use("/attendance",require("./routes/attendanceRouter.js"))



app.listen(port,()=>{
    console.log("server is running on port : "+port)
})