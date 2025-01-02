import React, { useEffect, useState } from 'react';
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
  CircularProgress,
  Alert,
  Paper,
  CardActions,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const SurveyList = () => {
  const [surveyList, setSurveyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const { data } = await surveys.getAll();
      console.log('获取到的问卷列表:', data);
      setSurveyList(data);
    } catch (error) {
      console.error('加载问卷失败:', error);
      setError('加载问卷失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">待填写的问卷</Typography>
        {user && (
          <Button
            component={Link}
            to="/surveys/create"
            variant="contained"
            color="primary"
            startIcon={<AddCircleOutlineIcon />}
          >
            创建问卷
          </Button>
        )}
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && surveyList.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            暂无可参与的问卷
          </Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        {surveyList.map((survey) => (
          <Grid item xs={12} sm={6} md={4} key={survey.survey_id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {survey.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {survey.description || '暂无描述'}
                </Typography>
                <Box sx={{ mt: 'auto' }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        创建者: {survey.creator_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        创建于: {formatDate(survey.created_at)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        问题数: {survey.question_count}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        已答: {survey.response_count || 0}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  component={Link}
                  to={`/surveys/${survey.survey_id}`}
                  variant="contained"
                  fullWidth
                  color="primary"
                >
                  参与调查
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default SurveyList; 