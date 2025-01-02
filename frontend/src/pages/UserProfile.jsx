import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/api';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

const UserProfile = () => {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editableFields, setEditableFields] = useState({
    username: false,
    email: false,
    password: false,
  });

  useEffect(() => {
    if (user && user.user) {
      setFormData(prev => ({
        ...prev,
        username: user.user.username,
        email: user.user.email,
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCheckboxChange = (e) => {
    setEditableFields({
      ...editableFields,
      [e.target.name]: e.target.checked,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // 检查密码是否需要更新
    if (editableFields.password && formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    // 构建更新数据对象
    const updateData = {};

    if (editableFields.username) {
      updateData.username = formData.username;
    }

    if (editableFields.email) {
      updateData.email = formData.email;
    }

    if (editableFields.password) {
      updateData.password = formData.password;
    }

    if (Object.keys(updateData).length === 0) {
      setError('请至少选择一个字段进行修改');
      return;
    }

    try {
      await auth.updateCurrentUser(updateData);
      setMessage('信息更新成功');
      // 重新获取最新的用户信息
      const { data } = await auth.getCurrentUser();
      login(data);
      // 重置表单
      setEditableFields({
        username: false,
        email: false,
        password: false,
      });
    } catch (err) {
      console.error('更新信息错误:', err);
      setError(err.response?.data?.error || '更新信息失败');
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          用户设置
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editableFields.username}
                  onChange={handleCheckboxChange}
                  name="username"
                />
              }
              label="修改用户名"
            />
          </Box>
          <TextField
            fullWidth
            label="用户名"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            disabled={!editableFields.username}
            required={editableFields.username}
          />

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editableFields.email}
                  onChange={handleCheckboxChange}
                  name="email"
                />
              }
              label="修改邮箱"
            />
          </Box>
          <TextField
            fullWidth
            label="邮箱"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            disabled={!editableFields.email}
            required={editableFields.email}
          />

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editableFields.password}
                  onChange={handleCheckboxChange}
                  name="password"
                />
              }
              label="修改密码"
            />
          </Box>
          <TextField
            fullWidth
            label="新密码"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            disabled={!editableFields.password}
            required={editableFields.password}
          />
          <TextField
            fullWidth
            label="确认新密码"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            margin="normal"
            disabled={!editableFields.password}
            required={editableFields.password}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {message && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {message}
            </Alert>
          )}
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              fullWidth
            >
              保存更改
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default UserProfile;
