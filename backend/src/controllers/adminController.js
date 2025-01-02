const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// 获取所有用户列表
const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT user_id, username, email, role, created_at FROM users'
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
};

// 修改用户角色
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;  // 从URL参数获取userId
    const { role } = req.body;      // 从请求体获取role
    
    await pool.query(
      'UPDATE users SET role = ? WHERE user_id = ?',
      [role, userId]
    );
    res.json({ message: '用户角色更新成功' });
  } catch (error) {
    console.error('更新角色失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

// 删除用户
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);
    res.json({ message: '用户删除成功' });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
};

// 获取系统统计信息
const getSystemStats = async (req, res) => {
  try {
    const [[userCount]] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [[surveyCount]] = await pool.query('SELECT COUNT(*) as count FROM surveys');
    const [[responseCount]] = await pool.query('SELECT COUNT(*) as count FROM responses');
    
    res.json({
      userCount: userCount.count,
      surveyCount: surveyCount.count,
      responseCount: responseCount.count
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
};

const updateUserInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, resetPassword } = req.body;
    
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
    
    if (resetPassword) {
      const hashedPassword = await bcrypt.hash('123456', 8);
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
  getAllUsers,
  updateUserRole,
  deleteUser,
  getSystemStats,
  updateUserInfo
}; 