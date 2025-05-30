import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
const {Schema}=mongoose;
const userSchema=new mongoose.Schema({

    username:{
        type:String,
        unique:true,
        required:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        unique:true,
        required:true,
        trim:true,
        lowercase:true   
    },
    fullName:{
        type:String,
        required:true,
        trim:true
    },
    avatar:{
        type:String, //cloudnary url
        required:true,

    },
    coverImage:{
        type:String , //cloudnaru url

    },
    watchHistory:[
        {

            type:Schema.Types.ObjectId,
            ref:"Video"  
            
        }
    ],
    password:
    {
        type:String,
        required:[true,"Password is required"],

    
    },
    refreshToken:{
        type:String,

    },
    videos:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
  
 


},{timestamps:true})

userSchema.pre("save",async function(next){
    if(this.isModified("password")){

        this.password = await bcrypt.hash(this.password,10)
        next()
    }else{
        return next()
    }
})

userSchema.methods.isPasswordCorrect = async function(password){
     return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken= function(){
   return jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}

userSchema.methods.generateRefreshToken= function(){
    return jwt.sign({
        _id:this._id,
    },

    process.env.REFRESH_TOKEN_SECRET,

    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)
}


export const User=mongoose.model("User",userSchema)

