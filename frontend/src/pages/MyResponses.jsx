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
  CircularProgress,
} from '@mui/material';

const MyResponses = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMyResponses();
  }, []);

  const loadMyResponses = async () => {
    try {
      setLoading(true);
      const { data } = await surveys.getMyResponses();
      setResponses(data);
    } catch (error) {
      setError('加载回答失败');
      console.error('加载回答失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        我的回答
      </Typography>
      {responses.length === 0 ? (
        <Typography>还没有回答过任何问卷</Typography>
      ) : (
        <Grid container spacing={3}>
          {responses.map((response) => (
            <Grid item xs={12} sm={6} md={4} key={response.survey_id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {response.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    回答时间: {new Date(response.response_date).toLocaleDateString()}
                  </Typography>
                  <Button
                    component={Link}
                    to={`/surveys/${response.survey_id}/edit`}
                    variant="outlined"
                    fullWidth
                  >
                    编辑回答
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default MyResponses; 