const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods:["GET","POST"]
  }
});

let dealyMap = new Map()
let requsetMap = new Map()
let responseMap = new Map()

// 객체 배열의 원소 중 객체의 특정 속성이 특정 값인지 확인
function findObjectByPropertyValue(array, property, value) {
  return array.find(obj => obj[property] === value);
}

// 객체 배열의 원소 중 객체의 특정 속성만 추출해서 다른 배열로 만들기
function extractProperties(array, property) {
  return array.map(obj => obj[property]);
}

//roomAndMember에서 특정 socket id 가진 원소 삭제
function removeBySocketId(obj, socketId) {
  for (let prop in obj) {
    if (Array.isArray(obj[prop])) {
      obj[prop] = obj[prop].filter(item => !(item.socketId && item.socketId === socketId));
    }
  }
}

io.on('connection', (socket) => {
  console.log(`${socket.id} user connected`);

  socket.on('band', (data) => {
      socket.join(data.bandId);
      const room = Array.from(io.sockets.adapter.rooms.get(data.bandId));
      console.log(room);
      socket.broadcast.to(data.bandId).emit('bandRecieved', `유저 ${data.userId} 입장`);
      // socket.emit('bandRecieved', room.filter((item) => item != socket.id));
    })

  // roomId : '곰문곰'
  socket.on('signaling', (data) => {
    io.to(data.bandId).emit('signalingRecieved', '시작');
  })

  // 클라이언트는 ping 으로 요청 보내면 됨
  socket.on('ping', () => {
    const date = new Date();
    requsetMap.set(socket.id, date.getTime())
    io.to(socket.id).emit('pingRecieved')
  })

  // 클라이언트가 answer로 요청 보내면 받아서 딜레이 계산
  socket.on('answer', () => {
    const date = new Date();
    dealyMap.set(socket.id, date.getTime() - requsetMap.get(socket.id));
    console.log(socket.id + ' ' + dealyMap.get(socket.id));
    io.to(socket.id).emit('answerRecieved', dealyMap.get(socket.id));
  })

  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnected`);
  });

});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});