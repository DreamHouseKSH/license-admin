const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'super-secret-dev-key'; // server.js와 동일한 방식 사용

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    console.log("Auth Middleware: No token provided");
    return res.sendStatus(401); // 토큰 없음
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("Auth Middleware: Invalid token", err.message);
      return res.sendStatus(403); // 토큰 유효하지 않음
    }
    req.user = user; // 요청 객체에 사용자 정보 저장 (여기서는 username)
    console.log("Auth Middleware: Token verified for user:", user.sub);
    next(); // 다음 미들웨어 또는 라우트 핸들러로 진행
  });
};

// Socket.IO 인증 미들웨어 (server.js에서 사용)
const authenticateSocketToken = (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.log("Socket Auth Middleware: No token provided");
    return next(new Error("Authentication error: Token not provided"));
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Socket Auth Middleware: Invalid token", err.message);
      return next(new Error("Authentication error: Invalid token"));
    }
    // socket.decoded = decoded; // 필요시 디코딩된 정보 저장
    console.log(`Socket authenticated for user: ${decoded.sub}`);
    next();
  });
};


module.exports = {
  authenticateToken,
  authenticateSocketToken
};
