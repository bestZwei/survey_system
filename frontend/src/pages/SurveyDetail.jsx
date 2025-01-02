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
  FormControl
} from '@mui/material';

const SurveyDetail = ({ edit }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSurvey();
    if (edit) {
      loadExistingResponse();
    }
  }, [id, edit]);

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

  const loadExistingResponse = async () => {
    try {
      const { data } = await surveys.getSurveyResponse(id);
      const initialAnswers = {};
      data.forEach((response) => {
        if (response.answer_text && response.answer_text.includes(',')) {
          // 处理多选题答案
          initialAnswers[response.question_id] = response.answer_text.split(',');
        } else {
          initialAnswers[response.question_id] = response.answer_text || response.option_id;
        }
      });
      setAnswers(initialAnswers);
    } catch (error) {
      setError('加载已有回答失败');
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
      const formattedAnswers = Object.entries(answers).map(([questionId, value]) => {
        const question = survey.questions.find(q => q.question_id === questionId);
        return {
          questionId,
          text: question.type === 'MULTIPLE_CHOICE' ? value.join(',') : value,
          optionId: question.type === 'SINGLE_CHOICE' ? value : null
        };
      });

      if (edit) {
        await surveys.updateResponse(id, { answers: formattedAnswers });
      } else {
        await surveys.submit(id, { answers: formattedAnswers });
      }
      navigate('/my-responses');
    } catch (error) {
      setError(edit ? '更新答案失败' : '提交答案失败');
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

        <TextField
          fullWidth
          label="问卷链接"
          value={`${window.location.origin}/surveys/${survey.survey_id}`}
          InputProps={{
            readOnly: true,
          }}
          sx={{ mb: 3 }}
        />

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
                  value={answers[question.question_id] || ''}
                  onChange={(e) => handleAnswerChange(question.question_id, e.target.value, 'TEXT')}
                  required={question.required}
                />
              )}

              {question.type === 'SINGLE_CHOICE' && (
                <FormControl component="fieldset" required={question.required}>
                  <RadioGroup
                    value={answers[question.question_id] || ''}
                    onChange={(e) => handleAnswerChange(question.question_id, e.target.value, 'SINGLE_CHOICE')}
                  >
                    {question.options && question.options.map((option) => (
                      <FormControlLabel
                        key={option.option_id}
                        value={option.option_id}
                        control={<Radio />}
                        label={option.option_text}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}

              {question.type === 'MULTIPLE_CHOICE' && (
                <FormControl component="fieldset" required={question.required}>
                  <FormGroup>
                    {question.options && question.options.map((option) => (
                      <FormControlLabel
                        key={option.option_id}
                        control={
                          <Checkbox
                            checked={Array.isArray(answers[question.question_id]) && 
                                    answers[question.question_id].includes(option.option_id)}
                            onChange={() => handleAnswerChange(question.question_id, option.option_id, 'MULTIPLE_CHOICE')}
                          />
                        }
                        label={option.option_text}
                      />
                    ))}
                  </FormGroup>
                </FormControl>
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
            {edit ? '更新答案' : (user ? '提交问卷' : '请先登录')}
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default SurveyDetail; 