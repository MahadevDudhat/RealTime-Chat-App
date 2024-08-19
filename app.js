require("dotenv").config();

var mongoose = require("mongoose");

mongoose.connect('mongodb://127.0.0.1:27017/realchat');

const app = require("express")();
const http = require("http").Server(app);

const userRoute = require("./routes/userRoute");
const User = require("./models/userModel");
const Chat = require("./models/chatModel");


app.use('/',userRoute);

const io = require("socket.io")(http);

var usp = io.of("/user-namespace");

usp.on("connection",async function(socket){

    console.log('user connected');

  let userId = socket.handshake.auth.token;

  try {
    await User.findByIdAndUpdate({ _id: userId }, { $set: { is_online: '1' } });
    socket.broadcast.emit('getOnlineUser', { user_id: userId });
  } catch (error) {
    console.error('Error updating user online status:', error);
  }

  socket.on('disconnect', async function () {
    console.log('user disconnected');

    try {
      await User.findByIdAndUpdate({ _id: userId }, { $set: { is_online: '0' } });
      socket.broadcast.emit('getOfflineUser', { user_id: userId });
    } catch (error) {
      console.error('Error updating user offline status:', error);
    }
  });
    //chating implementation
    socket.on("newChat",function(data){
        socket.broadcast.emit("loadNewChat",data);
    });

    //loading old chats by fetching from database by using find()and using $or
    socket.on("existChat",async function(data){
        var chats = await Chat.find({$or:[
            {sender_id:data.sender_id,receiver_id:data.receiver_id},
            {sender_id:data.receiver_id,receiver_id:data.sender_id}
        ]});
        socket.emit("loadChats",{chats:chats});
    });


});





http.listen(3000,function(){
    console.log("server started...")
});