const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({port:5000});

const sessions = new Map();
const rooms = {};

// 서버 시작 알림
wss.on('listening', () => {
  console.log('WebSocket server started on port 5000');
});

// 메시지 처리
wss.on('connection', (ws, req) => {
  const sessionId = uuidv4();

  sessions.set(sessionId, ws);

  ws.send(`Welcome! Your session ID is: ${sessionId}`);

  // 메시지 수신 이벤트 처리
  ws.on('message', (message) => {
    // 받을 json
    /*{
      "trackId": "3f9e01c8-dcd5-4b91-9dbf-ace73fb82032",
      "time": "2024-10-05T12:34:56Z" or null
    }*/
    try{
      const receivedData = JSON.parse(message);
      const trackId = receivedData.trackId;
      const time = receivedData.time;
      // 방에 JOIN 하는 로직
      if(time == null){
        // 새로운 방(track) 생성
        if(!rooms[trackId]) {
          rooms[trackId] = [];
        }

        rooms[trackId].push(sessionId);

        console.log(rooms[trackId]);

        ws.send("you joined " + trackId);
      } else /*전체에게 메시지 전송하는 로직*/ {
        rooms[trackId].map((id) => {
          const clientWs = sessions.get(id);
          if (clientWs && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(time);
          }
          return null;
        });
      }
    } catch (error){
      ws.send(JSON.stringify({
        error: error.message // 에러 메시지 전송
      }));
    }
  });

  // 연결 종료 시 처리
  ws.on('close', () => {
    console.log(`Client with session ID ${sessionId} disconnected`);
    sessions.delete(sessionId); // 세션 삭제

    // 방에서 세션 ID 삭제
    for (const trackId in rooms) {
      if (rooms[trackId].includes(sessionId)) {
        rooms[trackId] = rooms[trackId].filter(id => id !== sessionId); // 세션 ID 제거
        console.log(`Session ${sessionId} removed from room ${trackId}`);
        
        // 방이 비어 있으면 방 삭제
        if (rooms[trackId].length === 0) {
          delete rooms[trackId];
          console.log(`Room ${trackId} is now empty and has been deleted.`);
        } else {
          console.log(`Current users in room ${trackId}:`, rooms[trackId]);
        }
        break; // 이미 세션 ID를 찾아서 제거했으므로 루프 종료
      }
    }
  });
});