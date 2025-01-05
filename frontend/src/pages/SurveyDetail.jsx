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

const QuestionDisplay = ({ question, index, answers, handleAnswerChange, isPreview }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {`${index + 1}. ${question.question_text}`}
      </Typography>

      {question.type === 'TEXT' && (
        <TextField
          fullWidth
          value={answers[question.question_id] || ''}
          onChange={(e) => handleAnswerChange(question.question_id, e.target.value, 'TEXT')}
          disabled={isPreview}
          multiline
          rows={3}
        />
      )}

      {question.type === 'SINGLE_CHOICE' && (
        <RadioGroup
          value={answers[question.question_id] || ''}
          onChange={(e) => handleAnswerChange(question.question_id, e.target.value, 'SINGLE_CHOICE')}
        >
          {question.options.map((option) => (
            <FormControlLabel
              key={option.option_id}
              value={option.option_id}
              control={<Radio disabled={isPreview} />}
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
                  checked={answers[question.question_id]?.includes(option.option_id) || false}
                  onChange={(e) => handleAnswerChange(
                    question.question_id,
                    option.option_id,
                    'MULTIPLE_CHOICE'
                  )}
                  disabled={isPreview}
                />
              }
              label={option.option_text}
            />
          ))}
        </FormGroup>
      )}
    </Box>
  );
};

const SurveyDetail = ({ edit }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // 加载问卷基本信息
        const { data: surveyData } = await surveys.getById(id);
        setSurvey(surveyData);

        // 初始化空答案
        const initialAnswers = {};
        surveyData.questions.forEach((question) => {
          initialAnswers[question.question_id] = question.type === 'MULTIPLE_CHOICE' ? [] : '';
        });

        // 如果是编辑模式或从"我的回答"页面进入，加载已有答案
        if (edit || window.location.search.includes('preview=true')) {
          setIsPreview(window.location.search.includes('preview=true'));
          try {
            const { data: responseData } = await surveys.getSurveyResponse(id);
            responseData.forEach((response) => {
              if (response.answer_text && response.answer_text.includes(',')) {
                initialAnswers[response.question_id] = response.answer_text.split(',');
              } else {
                initialAnswers[response.question_id] = response.answer_text || response.option_id;
              }
            });
          } catch (error) {
            console.error('加载已有回答失败:', error);
          }
        }
        setAnswers(initialAnswers);
      } catch (error) {
        setError('加载问卷失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, edit]);

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

        {!isPreview && (
          <TextField
            fullWidth
            label="问卷链接"
            value={`${window.location.origin}/surveys/${survey.survey_id}`}
            InputProps={{
              readOnly: true,
            }}
            sx={{ mb: 3 }}
          />
        )}

        <form onSubmit={handleSubmit}>
          {survey.questions.map((question, index) => (
            <QuestionDisplay
              key={question.question_id}
              question={question}
              index={index}
              answers={answers}
              handleAnswerChange={handleAnswerChange}
              isPreview={isPreview}
            />
          ))}

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          {!isPreview && (
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={!user}
            >
              {edit ? '更新答案' : (user ? '提交问卷' : '请先登录')}
            </Button>
          )}
        </form>
      </Paper>
    </Container>
  );
};

export default SurveyDetail; 