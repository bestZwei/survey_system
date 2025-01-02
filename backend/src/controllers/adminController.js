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
    const { userId, role } = req.body;
    await pool.query(
      'UPDATE users SET role = ? WHERE user_id = ?',
      [role, userId]
    );
    res.json({ message: '用户角色更新成功' });
  } catch (error) {
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

module.exports = {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getSystemStats
}; 