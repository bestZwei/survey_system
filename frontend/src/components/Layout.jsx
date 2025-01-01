import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
} from '@mui/material';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
            问卷调查系统
          </Typography>
          {user ? (
            <>
              <Typography sx={{ mr: 2 }}>
                欢迎, {user.user.username}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                退出
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">
                登录
              </Button>
              <Button color="inherit" component={Link} to="/register">
                注册
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container>
        <Outlet />
      </Container>
    </>
  );
};

export default Layout; 