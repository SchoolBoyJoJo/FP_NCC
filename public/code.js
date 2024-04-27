(function(){

    const app = document.querySelector(".app");
    const socket = io();
    let uname;
    let currentRoom = "public";

    app.querySelector(".join-screen #join-user").addEventListener("click", function(){
        let username = app.querySelector(".join-screen #username").value;
        if(username.length === 0){
            return;
        }
        socket.emit("newuser", { username, room: currentRoom });
        uname = username;
        app.querySelector(".join-screen").classList.remove("active");
        app.querySelector(".chat-screen").classList.add("active");
    });

    app.querySelector(".chat-screen #send-message").addEventListener("click", function(){
        let message = app.querySelector(".chat-screen #message-input").value;
        if(message.length === 0){
            return;
        }
        socket.emit("chat", {
            username: uname,
            text: message,
            room: currentRoom
        });
        app.querySelector(".chat-screen #message-input").value = "";
    });

    app.querySelector(".chat-screen #exit-chat").addEventListener("click", function(){
        socket.emit("exituser");
        window.location.href = window.location.href;
    });

    app.querySelector(".chat-screen #create-private-room").addEventListener("click", function(){
        const roomName = prompt("Enter the name of the private room:");
        if(roomName) {
            socket.emit("createPrivateRoom", roomName);
        }
    });

    app.querySelector(".chat-screen #join-private-room").addEventListener("click", function(){
        socket.emit("getPrivateRooms");
    });

    app.querySelector(".chat-screen #exit-private-room").addEventListener("click", function(){
        socket.emit("exitPrivateRoom");
        currentRoom = "public";
    });

    socket.on("update", function(update){
        renderMessage("update", update);
    });

    socket.on("chat", function(data){
        const { username, text, room } = data;
        const sender = (username === uname) ? "You" : username;
            renderMessage("other", { username: sender, text, room });
        
    });
    

    socket.on("privateRoomsList", function(privateRoomsList){
        const roomsList = privateRoomsList.join("\n");
        alert("Available Private Rooms:\n" + roomsList);
        const roomToJoin = prompt("Enter the name of the room you want to join:");
        if(roomToJoin && privateRoomsList.includes(roomToJoin)) {
            socket.emit("joinPrivateRoom", roomToJoin);
            currentRoom = roomToJoin;
        } else {
            alert("Invalid room name or room is not available.");
        }
    });

    function renderMessage(type, message){
        let messageContainer = app.querySelector(".chat-screen .messages");
        if(type === "other"){
            let el = document.createElement("div");
            el.setAttribute("class", "message other-message");
            el.innerHTML = `
                <div>
                    <div class="name">${message.username}</div>
                    <div class="text">${message.text}</div>
                </div>
            `;
            messageContainer.appendChild(el);
        } else if(type === "update"){
            let el = document.createElement("div");
            el.setAttribute("class", "update");
            el.innerText = message;
            messageContainer.appendChild(el);
        }
        messageContainer.scrollTop = messageContainer.scrollHeight - messageContainer.clientHeight;
    }

})();
