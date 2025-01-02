import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, CircularProgress, Alert, Paper, List, ListItem, ListItemText, Box, LinearProgress } from '@mui/material';
import { surveys } from '../services/api';

const SurveyStats = () => {
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, [id]);

  const loadStats = async () => {
    try {
      const { data } = await surveys.getSurveyStats(id);
      setStats(data);
    } catch (error) {
      setError('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getQuestionTypeText = (type) => {
    const typeMap = {
      'TEXT': '文本题',
      'SINGLE_CHOICE': '单选题',
      'MULTIPLE_CHOICE': '多选题'
    };
    return typeMap[type] || type;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        问卷统计
      </Typography>
      
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      
      {stats && (
        <>
          <Typography variant="h6" gutterBottom>
            总回答人数: {stats.totalRespondents}
          </Typography>

          {/* 选择题统计 */}
          {stats.choiceStats.map(question => (
            <Paper key={question.questionId} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {question.questionText}
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  {getQuestionTypeText(question.type)}
                  {question.type === 'MULTIPLE_CHOICE' && 
                    ` (共${question.totalResponses}人回答)`}
                </Typography>
              </Box>
              <List>
                {question.options.map(option => (
                  <ListItem key={option.optionId}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography>{option.text}</Typography>
                          <Typography color="textSecondary">
                            {option.count}人选择
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={option.percentage}
                            sx={{ 
                              width: '200px',
                              height: '8px',
                              borderRadius: '4px'
                            }}
                          />
                          <Typography>{option.percentage}%</Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          ))}

          {/* 文本题统计 */}
          {stats.textResponses.map(question => (
            <Paper key={question.questionId} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {question.questionText}
                </Typography>
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                  {getQuestionTypeText('TEXT')}
                </Typography>
              </Box>
              <List>
                {question.answers.map((answer, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={answer.text}
                      secondary={`回答者: ${answer.username}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          ))}
        </>
      )}
    </Container>
  );
};

export default SurveyStats;