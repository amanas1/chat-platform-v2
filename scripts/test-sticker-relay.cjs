const { io } = require('socket.io-client');

const SOCKET_URL = 'http://localhost:3001';

async function testRelay() {
  console.log('🚀 Starting Sticker Relay Test...');
  
  const clientA = io(SOCKET_URL);
  const clientB = io(SOCKET_URL);

  let resolveA, resolveB;
  const promiseA = new Promise(r => resolveA = r);
  const promiseB = new Promise(r => resolveB = r);

  clientA.on('connect', () => {
    console.log('✅ Client A connected');
    clientA.emit('user:register', { id: 'user-a', name: 'Alice', avatar: 'av1' }, (res) => {
      console.log('✅ Client A registered');
      resolveA();
    });
  });

  clientB.on('connect', () => {
    console.log('✅ Client B connected');
    clientB.emit('user:register', { id: 'user-b', name: 'Bob', avatar: 'av2' }, (res) => {
      console.log('✅ Client B registered');
      resolveB();
    });
  });

  await Promise.all([promiseA, promiseB]);

  console.log('📡 Both clients registered. Attempting to send sticker from A to B...');

  // Simulate a session (normally created via Knock, but we can cheat in test if we know sessionId or just use a dummy)
  // The server allows sending to any sessionId if the user is a participant.
  // Let's create a session.
  const sessionId = 'test-session';
  // We need to manually inject this into the server state or just use the knock flow.
  // Actually, let's use the 'message:send' and see if it hits the delivery logic.
  
  clientB.on('message:received', (msg) => {
    console.log('📥 Client B received message:', msg.messageType);
    if (msg.messageType === 'sticker') {
      console.log('🎉 STICKER RELAY SUCCESS!');
      process.exit(0);
    }
  });

  // To send a message, Alice needs to be in a session with Bob.
  // Let's have Bob "knock" Alice or vice versa.
  clientA.emit('knock:send', { targetUserId: 'user-b' }, (res) => {
    console.log('🔔 Alice knocked Bob');
    // Bob listens for knock
  });

  clientB.on('knock:received', (knock) => {
    console.log('📩 Bob received knock from Alice (ID:', knock.fromUserId, ')');
    clientB.emit('knock:accept', { knockId: knock.id, fromUserId: knock.fromUserId });
  });

  clientB.on('session:created', (data) => {
    console.log('🤝 Bob session created:', data.sessionId);
    // Wait for Alice to also be ready (she gets knock:accepted)
  });

  clientA.on('knock:accepted', (data) => {
    console.log('🤝 Alice knock accepted. Session:', data.sessionId);
    const sid = data.sessionId;
    
    // Now Alice sends a sticker
    console.log('📤 Alice sending sticker...');
    clientA.emit('message:send', {
      sessionId: sid,
      encryptedPayload: 'encrypted_sticker_url',
      messageType: 'sticker',
      metadata: { text: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp' }
    }, (ack) => {
      console.log('📤 Alice sticker sent ack:', ack.success);
    });
  });

  setTimeout(() => {
    console.error('❌ Test timed out!');
    process.exit(1);
  }, 10000);
}

testRelay();
