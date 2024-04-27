const express = require("express");
const path = require("path");

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.use(express.static(path.join(__dirname, "public")));

const users = {};
const privateRooms = new Set();

io.on("connection", function(socket) {
    socket.on("newuser", function(data) {
        const { username } = data;
        const defaultRoom = "public";
        socket.username = username;
        socket.join(defaultRoom);
        users[socket.id] = { username, room: defaultRoom };
        io.to(defaultRoom).emit("update", `${username} joined the conversation`);
    });

    socket.on("exituser", function() {
        const { username, room } = users[socket.id];
        delete users[socket.id];
        socket.leave(room);
        io.to(defaultRoom).emit("update", `${username} left the conversation`);
    });

    socket.on("chat", function(data) {
        const { username, text, room } = data;
        io.to(room).emit("chat", { username, text });
        if (privateRooms.has(room)) {
            users[socket.id].lastMessages = users[socket.id].lastMessages || [];
            users[socket.id].lastMessages.push({ username, text });
        }
    });

    socket.on("createPrivateRoom", function(room) {
        privateRooms.add(room);
    });

    socket.on("getPrivateRooms", function() {
        socket.emit("privateRoomsList", Array.from(privateRooms));
    });

    socket.on("joinPrivateRoom", function(room) {
        socket.leave("public");
        socket.join(room);
        users[socket.id].room = room;
        io.to(room).emit("update", `${socket.username} joined ${room}`);
    });

    socket.on("exitPrivateRoom", function() {
        const { username, room } = users[socket.id];
        if (room !== "public") {
            socket.leave(room); 
            socket.join("public"); 
            users[socket.id].room = "public"; 
            io.to(room).emit("update", `${username} left the ${room} room`); 
            socket.emit("update", `You left the ${room} room`);
        }
    });


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
