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
        const { username, room } = data;
        socket.username = username; 

        const defaultRoom = "public";
        socket.join(defaultRoom);
        users[socket.id] = { username, room: defaultRoom }; 
        io.to(defaultRoom).emit("update", `${username} joined the conversation`);
    });

    socket.on("exituser", function() {
        const { username, room } = users[socket.id];
        delete users[socket.id]; // Hapus informasi pengguna saat mereka keluar
        socket.leave(room); // Keluar dari ruangan yang ditentukan oleh pengguna
        io.to(room).emit("update", `${username} left the conversation`);
    
        // Jika pengguna keluar dari ruangan privat, kirim pesan-pesan mereka ke ruangan publik
        if (privateRooms.has(room)) {
            // Kirim semua pesan pengguna yang terkait dengan ruangan privat ke ruangan publik
            for (const id in users) {
                if (users[id].username === username && users[id].room === room) {
                    io.to("public").emit("chat", { username, text: users[id].lastMessages });
                }
            }
        }
    });
    
    socket.on("chat", function(data) {
        const { username, text, room } = data;
        io.to(room).emit("chat", { username, text });

        if (privateRooms.has(room)) {
            if (!users[socket.id].hasOwnProperty("lastMessages")) {
                users[socket.id].lastMessages = [];
            }
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
            io.to(room).emit("update", `${username} left the private room`);
            io.to("public").emit("update", `${username} joined the public room`);
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
