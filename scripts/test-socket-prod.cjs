const { io } = require("socket.io-client");

console.log("Connecting to Railway...");
const socket = io("https://streamflow-main-2-production.up.railway.app", {
    transports: ['websocket', 'polling']
});

socket.on("connect", () => {
    console.log("Connected! socket id:", socket.id);
});

socket.on("presence:count", (data) => {
    console.log("presence:count received:", data);
});

socket.on("presence:list", (users) => {
    console.log(`presence:list received! Array length: ${users.length}`);
    const withAvatars = users.filter(u => u.avatar);
    console.log(`Users with avatars: ${withAvatars.length}`);
    process.exit(0);
});

setTimeout(() => {
    console.log("Timeout waiting for presence:list");
    process.exit(1);
}, 10000);
