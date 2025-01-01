import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveys } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Button,
  CircularProgress,
} from '@mui/material';

const SurveyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSurvey();
  }, [id]);

  const loadSurvey = async () => {
    try {
      const { data } = await surveys.getById(id);
      setSurvey(data);
      // 初始化答案
      const initialAnswers = {};
      data.questions.forEach((question) => {
        initialAnswers[question.question_id] = question.type === 'MULTIPLE_CHOICE' ? [] : '';
      });
      setAnswers(initialAnswers);
    } catch (error) {
      setError('加载问卷失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value, type) => {
    if (type === 'MULTIPLE_CHOICE') {
      setAnswers(prev => ({
        ...prev,
        [questionId]: prev[questionId].includes(value)
          ? prev[questionId].filter(v => v !== value)
          : [...prev[questionId], value],
      }));
    } else {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        text: Array.isArray(value) ? value.join(',') : value,
      }));

      await surveys.submit(id, { answers: formattedAnswers });
      navigate('/surveys');
    } catch (error) {
      setError('提交答案失败');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!survey) {
    return (
      <Container>
        <Typography color="error">问卷不存在</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          {survey.title}
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          {survey.description}
        </Typography>

        <form onSubmit={handleSubmit}>
          {survey.questions.map((question, index) => (
            <Box key={question.question_id} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                {index + 1}. {question.question_text}
                {question.required && <span style={{ color: 'red' }}> *</span>}
              </Typography>

              {question.type === 'TEXT' && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={answers[question.question_id]}
                  onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                  required={question.required}
                />
              )}

              {question.type === 'SINGLE_CHOICE' && (
                <RadioGroup
                  value={answers[question.question_id]}
                  onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                >
                  {question.options.map((option) => (
                    <FormControlLabel
                      key={option.option_id}
                      value={option.option_id}
                      control={<Radio />}
                      label={option.option_text}
                    />
                  ))}
                </RadioGroup>
              )}

              {question.type === 'MULTIPLE_CHOICE' && (
                <FormGroup>
                  {question.options.map((option) => (
                    <FormControlLabel
                      key={option.option_id}
                      control={
                        <Checkbox
                          checked={answers[question.question_id].includes(option.option_id)}
                          onChange={(e) => handleAnswerChange(question.question_id, option.option_id, 'MULTIPLE_CHOICE')}
                        />
                      }
                      label={option.option_text}
                    />
                  ))}
                </FormGroup>
              )}
            </Box>
          ))}

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={!user}
          >
            {user ? '提交问卷' : '请先登录'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default SurveyDetail; 