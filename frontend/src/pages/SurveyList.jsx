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
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const SurveyList = () => {
  const [surveyList, setSurveyList] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      const { data } = await surveys.getAll();
      setSurveyList(data);
    } catch (error) {
      console.error('加载问卷失败:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4">问卷列表</Typography>
        {user && (
          <Button
            component={Link}
            to="/surveys/create"
            variant="contained"
            color="primary"
          >
            创建问卷
          </Button>
        )}
      </Box>
      <Grid container spacing={3}>
        {surveyList.map((survey) => (
          <Grid item xs={12} sm={6} md={4} key={survey.survey_id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {survey.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  创建者: {survey.creator_name}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button
                    component={Link}
                    to={`/surveys/${survey.survey_id}`}
                    variant="outlined"
                    fullWidth
                  >
                    查看详情
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default SurveyList; 