const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
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
    
    // 检查是否是第一个用户
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    const isFirstUser = userCount[0].count === 0;
    
    // 创建新用户，如果是第一个用户则设置为管理员
    const userId = uuidv4();
    await pool.query(
      'INSERT INTO users (user_id, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [userId, username, email, hashedPassword, isFirstUser ? 'admin' : 'user']
    );

    res.status(201).json({ 
      message: isFirstUser ? '注册成功，您是第一个用户，已被设置为管理员' : '注册成功'
    });
  } catch (error) {
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

const getUserInfo = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT user_id, username, email FROM users WHERE user_id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ 
      token: req.header('Authorization').replace('Bearer ', ''),
      user: users[0]
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
};

const updateUserInfo = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const userId = req.user.userId;
    
    // 构建更新查询
    let query = 'UPDATE users SET';
    const params = [];
    const updates = [];
    
    if (username) {
      updates.push(' username = ?');
      params.push(username);
    }
    
    if (email) {
      // 检查邮箱是否被其他用户使用
      const [existingUsers] = await pool.query(
        'SELECT * FROM users WHERE email = ? AND user_id != ?',
        [email, userId]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: '该邮箱已被使用' });
      }
      
      updates.push(' email = ?');
      params.push(email);
    }
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 8);
      updates.push(' password = ?');
      params.push(hashedPassword);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: '没有要更新的字段' });
    }
    
    query += updates.join(',') + ' WHERE user_id = ?';
    params.push(userId);

    await pool.query(query, params);
    
    res.json({ message: '用户信息更新成功' });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = {
  register,
  login,
  getUserInfo,
  updateUserInfo
}; 