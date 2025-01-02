const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { 
  getAllUsers, 
  updateUserRole, 
  deleteUser,
  getSystemStats,
  updateUserInfo
} = require('../controllers/adminController');

router.get('/users', auth, adminAuth, getAllUsers);
router.put('/users/:userId/role', auth, adminAuth, updateUserRole);
router.delete('/users/:userId', auth, adminAuth, deleteUser);
router.get('/stats', auth, adminAuth, getSystemStats);
router.put('/users/:userId/info', auth, adminAuth, updateUserInfo);

module.exports = router; 