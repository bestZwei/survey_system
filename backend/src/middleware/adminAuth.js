const adminAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    next();
  } catch (error) {
    res.status(403).json({ error: '需要管理员权限' });
  }
};

module.exports = adminAuth; 