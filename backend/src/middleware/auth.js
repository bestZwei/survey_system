const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 从数据库获取最新的用户信息，包括角色
    const [users] = await pool.query(
      'SELECT user_id, email, role FROM users WHERE user_id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      throw new Error();
    }

    req.user = {
      userId: users[0].user_id,
      email: users[0].email,
      role: users[0].role
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: '请先登录' });
  }
};

module.exports = auth; 