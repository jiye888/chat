const express = require('express');
const http = require('http');
const path = require('path');
require ('dotenv').config({path: path.join(__dirname, '.env')});
const socketConnection = require('./socketIndex');
const {onlineMembers} = require('./onlineMembers');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const {init} = require('./socket');
const authRoute = require('./route/authRoute');
const memberRoute = require('./route/memberRoute');
const chatRoute = require('./route/chatRoute');
const friendRoute = require('./route/friendRoute');
const {registerSystemMember} = require('./service/memberService');
const errorHandler = require('./error/errorHandler');
const mongoose = require('./db/mongoose');

const fs = require('fs');
const crypto = require('crypto');

const envPath = path.join(__dirname, '.env');
const secretKey_R = crypto.randomBytes(32).toString('hex');
const secretKey_A = crypto.randomBytes(32).toString('hex');

if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf-8');

    if (envContent.includes('JWT_SECRET_R=')) {
        envContent = envContent.replace(/JWT_SECRET_R=.*/g, `JWT_SECRET_R=${secretKey_R}`);
    } else {
        envContent += `\nJWT_SECRET_R=${secretKey_R}`;
    }

    if (envContent.includes('JWT_SECRET_A=')) {
        envContent = envContent.replace(/JWT_SECRET_A=.*/g, `JWT_SECRET_A=${secretKey_A}`);
    } else {
        envContent += `\nJWT_SECRET_A=${secretKey_A}`;
    }

    fs.writeFileSync(envPath, envContent);
} else {
    throw new Error('.env 파일을 찾을 수 없습니다.');
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

const PORT = process.env.PORT;

const server = http.createServer(app);

const io = init(server);

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) return next(new Error("토큰 필요"));

        const member = jwt.verify(token, process.env.JWT_SECRET_A);
        socket.member = member;
        next();
    } catch (err) {
        socket.emit('auth-error', {message: 'JWT 인증에 실패했습니다. 다시 로그인해주세요.'});
        console.error('소켓 인증 실패: ', err.message);
        return next(new Error('JWT 인증 실패'));
    }
});

//react와 통신 위해 개발 단계에서는 필요.
const cors = require('cors');
app.use(cors({
 origin: ['http://localhost:3033', 'http://localhost:3033'], //process.env.CORS_ORIGIN
 credentials: true,
}));

app.use('/auth', authRoute);
app.use('/member', memberRoute);
app.use('/chat', chatRoute);
app.use('/friend', friendRoute);

app.use(errorHandler);

io.on('connection', (socket) => {
    const memberId = socket.member.id;
    socket.join(memberId);
    onlineMembers[memberId] = socket.id;
    console.log('새 사용자 접속: ', socket.member.id);
    socketConnection(io, socket);

    socket.on('disconnect', () => {
        const memberId = socket.member.id;
        if (memberId) {
            delete onlineMembers[memberId];
        }
    });
});


//정적 파일 제공

app.get('/', (req, res) => {
    res.send('Start');
});


mongoose.connection.once('open', async () => {
    const systemMember = await registerSystemMember();
    global.SYSTEM_MEMBER_ID = systemMember._id;
    console.log(`SYSTEM_MEMBER_ID: ${SYSTEM_MEMBER_ID}`);
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Running on ${PORT}`);
    });
});

server.listen(PORT);

app.use(express.static(path.join(__dirname, '../client/build')));

const clientPath = path.join(__dirname, '../client/build/index.html');

app.get('/*', (req, res) => {
    res.sendFile(clientPath);
});

module.exports = {server};