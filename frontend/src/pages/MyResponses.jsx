import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { surveys } from '../services/api';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';

const MyResponses = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadMyResponses();
  }, []);

  const loadMyResponses = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await surveys.getMyResponses();
      if (!Array.isArray(data)) {
        throw new Error('返回数据格式错误');
      }
      setResponses(data);
    } catch (error) {
      console.error('加载回答失败:', error);
      const errorMessage = error.response?.data?.details || 
                          error.response?.data?.error || 
                          error.message || 
                          '加载回答失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '未知时间';
    try {
      return new Date(dateString).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '日期格式错误';
    }
  };

  const handleDeleteClick = (survey) => {
    setSelectedSurvey(survey);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await surveys.deleteResponse(selectedSurvey.survey_id);
      setResponses(responses.filter(r => r.survey_id !== selectedSurvey.survey_id));
      setSnackbar({
        open: true,
        message: '回答删除成功',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: '删除失败',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedSurvey(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        我的回答
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {responses.map((response) => (
          <Grid item xs={12} sm={6} md={4} key={response.survey_id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {response.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  提交时间: {formatDate(response.submitted_at)}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    component={Link}
                    to={`/surveys/${response.survey_id}?preview=true`}
                    variant="outlined"
                    size="small"
                    fullWidth
                  >
                    查看问卷
                  </Button>
                  <Button
                    component={Link}
                    to={`/surveys/${response.survey_id}/edit`}
                    variant="contained"
                    size="small"
                    fullWidth
                  >
                    编辑回答
                  </Button>
                  <Button
                    onClick={() => handleDeleteClick(response)}
                    variant="outlined"
                    color="error"
                    size="small"
                    fullWidth
                  >
                    删除
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          确定要删除这个问卷的回答吗？此操作不可撤销。
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            删除
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MyResponses; 