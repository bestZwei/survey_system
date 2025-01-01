const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// 创建新问卷
const createSurvey = async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    const creatorId = req.user.userId;
    const surveyId = uuidv4();

    // 开启事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 创建问卷
      await connection.query(
        'INSERT INTO surveys (survey_id, title, description, creator_id) VALUES (?, ?, ?, ?)',
        [surveyId, title, description, creatorId]
      );

      // 创建问题
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const questionId = uuidv4();

        await connection.query(
          'INSERT INTO questions (question_id, survey_id, question_text, question_type, question_order, required) VALUES (?, ?, ?, ?, ?, ?)',
          [questionId, surveyId, question.text, question.type, i + 1, question.required]
        );

        // 如果是选择题，创建选项
        if (question.options && question.options.length > 0) {
          for (let j = 0; j < question.options.length; j++) {
            const optionId = uuidv4();
            await connection.query(
              'INSERT INTO options (option_id, question_id, option_text, option_order) VALUES (?, ?, ?, ?)',
              [optionId, questionId, question.options[j], j + 1]
            );
          }
        }
      }

      await connection.commit();
      res.status(201).json({ message: '问卷创建成功', surveyId });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
};

// 获取问卷列表
const getSurveys = async (req, res) => {
  try {
    const [surveys] = await pool.query(
      'SELECT s.*, u.username as creator_name FROM surveys s JOIN users u ON s.creator_id = u.user_id WHERE s.status = "PUBLISHED" ORDER BY s.created_at DESC'
    );
    res.json(surveys);
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
};

// 获取问卷详情
const getSurveyById = async (req, res) => {
  try {
    const { surveyId } = req.params;

    // 获取问卷基本信息
    const [surveys] = await pool.query(
      'SELECT s.*, u.username as creator_name FROM surveys s JOIN users u ON s.creator_id = u.user_id WHERE s.survey_id = ?',
      [surveyId]
    );

    if (surveys.length === 0) {
      return res.status(404).json({ error: '问卷不存在' });
    }

    const survey = surveys[0];

    // 获取问题
    const [questions] = await pool.query(
      'SELECT * FROM questions WHERE survey_id = ? ORDER BY question_order',
      [surveyId]
    );

    // 获取选项
    for (const question of questions) {
      if (question.question_type !== 'TEXT') {
        const [options] = await pool.query(
          'SELECT * FROM options WHERE question_id = ? ORDER BY option_order',
          [question.question_id]
        );
        question.options = options;
      }
    }

    survey.questions = questions;
    res.json(survey);
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
};

// 提交问卷回答
const submitResponse = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { answers } = req.body;
    const userId = req.user.userId;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const answer of answers) {
        const responseId = uuidv4();
        await connection.query(
          'INSERT INTO responses (response_id, survey_id, question_id, user_id, answer_text, option_id) VALUES (?, ?, ?, ?, ?, ?)',
          [responseId, surveyId, answer.questionId, userId, answer.text, answer.optionId]
        );
      }

      await connection.commit();
      res.json({ message: '问卷提交成功' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = {
  createSurvey,
  getSurveys,
  getSurveyById,
  submitResponse
}; 