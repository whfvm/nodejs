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

  // roomId : '곰문곰'
  socket.on('room', (data) => {
    socket.join(data.bandId);
    const room = Array.from(io.sockets.adapter.rooms.get(data.bandId));
    console.log(room);
    socket.emit('roomRecieved', room.filter((item) => item != socket.id));
  })
  // ['유저1','유저2','유저3'...]

  // offerReciever: '유저2', SDP: 'sdp문자열'
  socket.on('offer',(data) => {
    const offerRecieved = {
      offerSender: socket.id,
      SDP: data.SDP
    }
    io.to(data.offerReciever).emit('offerRecieved', offerRecieved);
  })
  // offerSender: '유저1', SDP: 'sdp문자열'

  //  answerReciever: '유저1;, SDP: 'sdp문자열'
  socket.on('answer',(data) =>{
    const answerRecieved = {
      answerSender: socket.id,
      SDP: data.SDP
    }
    io.to(data.answerReciever).emit('answerRecieved', answerRecieved);
  })
  //offerSender: '유저1;, SDP: 'sdp문자열'

  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnected`);
  });

});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});