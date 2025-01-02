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

// 获取用户创建的问卷
const getMySurveys = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [surveys] = await pool.query(
      'SELECT * FROM surveys WHERE creator_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(surveys);
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
};

// 获取用户的问卷回答
const getMyResponses = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [responses] = await pool.query(`
      SELECT DISTINCT 
        s.survey_id, 
        s.title,
        s.description,
        r.created_at as response_date
      FROM surveys s
      JOIN responses r ON s.survey_id = r.survey_id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
};

// 获取用户对特定问卷的回答
const getSurveyResponse = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const userId = req.user.userId;
    
    const [responses] = await pool.query(`
      SELECT 
        r.question_id,
        r.answer_text,
        r.option_id,
        q.question_type
      FROM responses r
      JOIN questions q ON r.question_id = q.question_id
      WHERE r.survey_id = ? AND r.user_id = ?
    `, [surveyId, userId]);
    
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
};

// 更新问卷回答
const updateResponse = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { answers } = req.body;
    const userId = req.user.userId;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 删除旧的回答
      await connection.query(
        'DELETE FROM responses WHERE survey_id = ? AND user_id = ?',
        [surveyId, userId]
      );

      // 插入新的回答
      for (const answer of answers) {
        const responseId = uuidv4();
        await connection.query(
          'INSERT INTO responses (response_id, survey_id, question_id, user_id, answer_text, option_id) VALUES (?, ?, ?, ?, ?, ?)',
          [responseId, surveyId, answer.questionId, userId, answer.text, answer.optionId]
        );
      }

      await connection.commit();
      res.json({ message: '回答更新成功' });
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
  submitResponse,
  getMySurveys,
  getMyResponses,
  getSurveyResponse,
  updateResponse
}; 