import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { surveys } from '../services/api';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const SurveyCreate = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        type: 'TEXT',
        required: false,
        options: [],
      },
    ]);
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value,
    };
    
    // 当问题类型改变时，初始化选项
    if (field === 'type') {
      if (value === 'SINGLE_CHOICE' || value === 'MULTIPLE_CHOICE') {
        if (!newQuestions[index].options || newQuestions[index].options.length === 0) {
          newQuestions[index].options = ['选项1'];
        }
      } else {
        newQuestions[index].options = [];
      }
    }
    
    setQuestions(newQuestions);
  };

  const handleAddOption = (questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options = [
      ...newQuestions[questionIndex].options,
      '',
    ];
    setQuestions(newQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleDeleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await surveys.create({
        title,
        description,
        questions,
      });
      navigate('/surveys');
    } catch (err) {
      setError(err.response?.data?.error || '创建问卷失败');
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          创建问卷
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="问卷标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="问卷描述"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              问题列表
            </Typography>
            <List>
              {questions.map((question, index) => (
                <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                    <TextField
                      fullWidth
                      label={`问题 ${index + 1}`}
                      value={question.text}
                      onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                      required
                    />
                    <FormControl sx={{ minWidth: 120 }}>
                      <InputLabel>类型</InputLabel>
                      <Select
                        value={question.type}
                        onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                        label="类型"
                      >
                        <MenuItem value="TEXT">文本</MenuItem>
                        <MenuItem value="SINGLE_CHOICE">单选</MenuItem>
                        <MenuItem value="MULTIPLE_CHOICE">多选</MenuItem>
                      </Select>
                    </FormControl>
                    <IconButton onClick={() => handleDeleteQuestion(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  {(question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') && (
                    <Box sx={{ ml: 2, mt: 2 }}>
                      {question.options.map((option, optionIndex) => (
                        <TextField
                          key={optionIndex}
                          label={`选项 ${optionIndex + 1}`}
                          value={option}
                          onChange={(e) => handleOptionChange(index, optionIndex, e.target.value)}
                          sx={{ mt: 1 }}
                          fullWidth
                        />
                      ))}
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => handleAddOption(index)}
                        sx={{ mt: 1 }}
                      >
                        添加选项
                      </Button>
                    </Box>
                  )}
                </ListItem>
              ))}
            </List>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddQuestion}
              variant="outlined"
              sx={{ mt: 2 }}
            >
              添加问题
            </Button>
          </Box>

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={questions.length === 0}
            >
              创建问卷
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default SurveyCreate; 