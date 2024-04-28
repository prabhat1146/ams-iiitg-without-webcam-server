const express=require("express")
const router=express.Router()

router.route("/").get((req,res)=>{
    res.json({APIadmin:"hi"})
})





module.exports=router;