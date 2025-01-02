import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow,
  Button,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  TextField
} from '@mui/material';
import { admin } from '../services/api';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: ''
  });
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        admin.getAllUsers(),
        admin.getSystemStats()
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await admin.updateUserRole(userId, newRole);
      loadData();
    } catch (error) {
      console.error('更新角色失败:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('确定要删除此用户吗？')) {
      try {
        await admin.deleteUser(userId);
        loadData();
      } catch (error) {
        console.error('删除用户失败:', error);
      }
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email
    });
  };

  const handleEditSubmit = async () => {
    try {
      await admin.updateUserInfo(editingUser.user_id, editForm);
      setEditingUser(null);
      loadData();
    } catch (error) {
      console.error('更新用户信息失败:', error);
    }
  };

  const handleResetPassword = async (userId) => {
    if (window.confirm('确定要重置该用户的密码为123456吗？')) {
      try {
        await admin.updateUserInfo(userId, { resetPassword: true });
        alert('密码重置成功');
      } catch (error) {
        console.error('重置密码失败:', error);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        管理员控制台
      </Typography>
      
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">用户总数</Typography>
                <Typography variant="h4">{stats.userCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">问卷总数</Typography>
                <Typography variant="h4">{stats.surveyCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">回答总数</Typography>
                <Typography variant="h4">{stats.responseCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>用户管理</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>用户名</TableCell>
              <TableCell>邮箱</TableCell>
              <TableCell>角色</TableCell>
              <TableCell>注册时间</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell>
                  {editingUser?.user_id === user.user_id ? (
                    <TextField
                      value={editForm.username}
                      onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                      size="small"
                    />
                  ) : (
                    user.username
                  )}
                </TableCell>
                <TableCell>
                  {editingUser?.user_id === user.user_id ? (
                    <TextField
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      size="small"
                    />
                  ) : (
                    user.email
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                    size="small"
                  >
                    <MenuItem value="user">普通用户</MenuItem>
                    <MenuItem value="admin">管理员</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  {editingUser?.user_id === user.user_id ? (
                    <>
                      <Button onClick={handleEditSubmit}>保存</Button>
                      <Button onClick={() => setEditingUser(null)}>取消</Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => handleEditClick(user)}>编辑</Button>
                      <Button onClick={() => handleResetPassword(user.user_id)}>
                        重置密码
                      </Button>
                      <Button 
                        color="error"
                        onClick={() => handleDeleteUser(user.user_id)}
                      >
                        删除
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default AdminDashboard; 