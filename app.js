require("dotenv").config();

var mongoose = require("mongoose");

mongoose.connect('mongodb://127.0.0.1:27017/realchat');

const app = require("express")();
const http = require("http").Server(app);

const userRoute = require("./routes/userRoute");
const User = require("./models/userModel");


app.use('/',userRoute);

const io = require("socket.io")(http);

var usp = io.of("/user-namespace");

usp.on("connection",async function(socket){

    console.log("user connected");
    let userId = socket.handshake.auth.token;
    await User.findByIdAndUpdate({_id:userId},{$set:{is_online: '1'}});

    socket.broadcast.emit("getOnlineUser",{ user_id:userId });

    socket.on("disconnect",async function(){
        console.log("user disconnected");
        let userId = socket.handshake.auth.token;
        await User.findByIdAndUpdate({_id:userId},{$set:{is_online: '0'}});
        socket.broadcast.emit("getOfflineUser",{ user_id:userId });

    });
});



http.listen(3000,function(){
    console.log("server started...")
});