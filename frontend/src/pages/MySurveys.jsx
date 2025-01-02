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
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';

const MySurveys = () => {
  const [mySurveys, setMySurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadMySurveys();
  }, []);

  const loadMySurveys = async () => {
    try {
      setLoading(true);
      const { data } = await surveys.getMySurveys();
      setMySurveys(data);
    } catch (error) {
      setError('加载问卷失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (survey) => {
    setSelectedSurvey(survey);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await surveys.deleteSurvey(selectedSurvey.survey_id);
      setMySurveys(mySurveys.filter(s => s.survey_id !== selectedSurvey.survey_id));
      setSnackbar({
        open: true,
        message: '问卷删除成功',
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        我创建的问卷
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {mySurveys.map((survey) => (
          <Grid item xs={12} sm={6} md={4} key={survey.survey_id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {survey.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  创建时间: {new Date(survey.created_at).toLocaleDateString()}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    component={Link}
                    to={`/surveys/${survey.survey_id}`}
                    variant="outlined"
                    fullWidth
                  >
                    查看详情
                  </Button>
                  <Button
                    component={Link}
                    to={`/surveys/${survey.survey_id}/stats`}
                    variant="contained"
                    color="primary"
                    fullWidth
                  >
                    查看统计
                  </Button>
                  <Button
                    onClick={() => handleDeleteClick(survey)}
                    variant="outlined"
                    color="error"
                    fullWidth
                  >
                    删除问卷
                  </Button>
                  <TextField
                    fullWidth
                    size="small"
                    value={`${window.location.origin}/surveys/${survey.survey_id}`}
                    InputProps={{
                      readOnly: true,
                    }}
                  />
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
          确定要删除这个问卷吗？此操作将同时删除所有相关的回答，且不可撤销。
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

export default MySurveys; 