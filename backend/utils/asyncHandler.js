const asyncHandler=(requestHandler)=>async (req,res,next)=>{
    try{    
        await requestHandler(req,res,next)

    }catch(error){
        res.status(error.statusCode || 500).json({
            message:error.message,
            success:false
        })
    }
}
export default asyncHandler;

/*

//asynchandler using try catch 

const asyncHandler= (reqHandler)=async (req,res,next)=>{
    try{
        await reqHandler(req,res,next)
    
    
    }catch(error){
        res.status(error.statusCode || 500).json({
        success:false,
        message:error.message})
    
    
    }
    
    
    }



*/ 