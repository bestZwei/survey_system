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
} from '@mui/material';

const MySurveys = () => {
  const [mySurveys, setMySurveys] = useState([]);

  useEffect(() => {
    loadMySurveys();
  }, []);

  const loadMySurveys = async () => {
    try {
      const { data } = await surveys.getMySurveys();
      setMySurveys(data);
    } catch (error) {
      console.error('加载问卷失败:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        我创建的问卷
      </Typography>
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
                <Box sx={{ mt: 2 }}>
                  <Button
                    component={Link}
                    to={`/surveys/${survey.survey_id}`}
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    查看详情
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
    </Container>
  );
};

export default MySurveys; 