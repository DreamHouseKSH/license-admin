const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'super-secret-dev-key';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    console.log("인증 미들웨어: 토큰 없음"); // 한국어
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("인증 미들웨어: 유효하지 않은 토큰", err.message); // 한국어
      return res.sendStatus(403);
    }
    req.user = user;
    console.log("인증 미들웨어: 토큰 검증 완료 (사용자:", user.sub + ")"); // 한국어
    next();
  });
};

// Socket.IO 인증 미들웨어
const authenticateSocketToken = (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.log("소켓 인증 미들웨어: 토큰 없음"); // 한국어
    return next(new Error("인증 오류: 토큰이 제공되지 않았습니다.")); // 한국어
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("소켓 인증 미들웨어: 유효하지 않은 토큰", err.message); // 한국어
      return next(new Error("인증 오류: 유효하지 않은 토큰입니다.")); // 한국어
    }
    console.log(`소켓 인증됨 (사용자: ${decoded.sub})`); // 한국어
    next();
  });
};


module.exports = {
  authenticateToken,
  authenticateSocketToken
};
