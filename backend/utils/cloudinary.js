//file  stored in local fine storage and from local file storage to cloudinary 
import {v2 as cloudinary} from "cloudinary"
import fs from "fs"  // file system inside node

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});


//method to get the filepath as parameter and upload it to the cloudinary function
const uploadOnCloudinary= async function(localFilePath){
    try{
        if(!localFilePath){
            return null}
        //upload the file on cloudinary 
            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })
            //file successfully uploaded
           
           fs.unlinkSync(localFilePath)
            return response
    }catch(error){
        fs.unlinkSync(localFilePath) // remove the localally saved temorary file as the upload operation got failed. 

        console.error("Cloudinary upload error:", error);
        return null
    }
}


export const deleteFromCloudinary=async function(localPath){
    try{
        if(!localPath)
            return null

        const response=await cloudinary.uploader.destroy(localPath)
      
        return response
    }
    catch(error)
  {
        console.error("Cloudinary destroy error:",error)
        return null;
    }


}








export default uploadOnCloudinary;



