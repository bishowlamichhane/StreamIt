import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"; 
import path from "path"
import fs from 'fs';

const app = express();

const _dirname = path.resolve();


// Ensure temp folder exists
const tempDir = path.join(_dirname, 'public', 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}




app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,

}))

app.use(express.json({limit:"16kb",}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(cookieParser())



//routes 
import router from './routes/user.routes.js'
import videoRouter from "./routes/video.routes.js"
import subsRouter from "./routes/subscription.routes.js"
import likeRouter from "./routes/like.routes.js"
import commentRouter from "./routes/comment.routes.js";
import commRouter from "./routes/community.routes.js";
import playlistRouter from "./routes/playlist.routes.js";


app.use('/api/v1/users',router)
app.use('/api/v1/videos',videoRouter)
app.use('/api/v1/subs',subsRouter)
app.use('/api/v1/likes',likeRouter)
app.use('/api/v1/comments',commentRouter)
app.use('/api/v1/community',commRouter)
app.use('/api/v1/playlists',playlistRouter)

app.use(express.static(path.join(_dirname,"/frontend/dist")));

app.get('*',(req,res)=>{
    res.sendFile(path.resolve(_dirname,"frontend","dist","index.html"));
  })
export default app;




