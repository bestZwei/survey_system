const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 输出请求数据以便调试
    console.log('注册请求数据:', { username, email });
    
    // 检查邮箱是否已存在
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 8);
    
    // 创建新用户
    const userId = uuidv4();
    await pool.query(
      'INSERT INTO users (user_id, username, email, password) VALUES (?, ?, ?, ?)',
      [userId, username, email, hashedPassword]
    );

    res.status(201).json({ message: '注册成功' });
  } catch (error) {
    // 详细的错误日志
    console.error('注册失败:', error);
    res.status(500).json({ error: '服务器错误: ' + error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const user = users[0];
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { 
      userId: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role
    }});
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = {
  register,
  login
}; 