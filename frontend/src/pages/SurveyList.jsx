import React, { useState, useEffect } from 'react';
import { surveys } from '../services/api';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Box,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const SurveyList = () => {
  const [surveyList, setSurveyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
    
    loadSurveys();
  }, []);

  const handleFillSurvey = (surveyId) => {
    window.open(`/surveys/${surveyId}`, '_blank');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && surveyList.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary" variant="h6">
            暂无可参与的问卷
          </Typography>
        </Paper>
      )}

      <Grid container spacing={3} alignItems="stretch">
        {surveyList.map((survey) => (
          <Grid item xs={12} sm={6} md={4} key={survey.survey_id}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              '&:hover': {
                boxShadow: 6
              }
            }}>
              <CardContent sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column',
                p: 3 
              }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  {survey.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="textSecondary" 
                  sx={{ 
                    mb: 2,
                    flexGrow: 1,
                    minHeight: '3em'
                  }}
                >
                  {survey.description || '暂无描述'}
                </Typography>
                <Box sx={{ mt: 'auto' }}>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        创建者: {survey.creator_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary" align="right">
                        问题数: {survey.question_count}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => handleFillSurvey(survey.survey_id)}
                    endIcon={<OpenInNewIcon />}
                    sx={{
                      mt: 'auto',
                      py: 1
                    }}
                  >
                    填写问卷
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {loading && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '200px'
        }}>
          <CircularProgress />
        </Box>
      )}
    </Container>
  );
};

export default SurveyList; 