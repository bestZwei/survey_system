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
          [questionId, surveyId, question.text, question.type, i + 1, question.required || false]
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
    if (!req.user) {
      console.log('未授权访问，返回空列表');
      return res.json([]);
    }

    const userId = req.user.userId;
    console.log('当前用户ID:', userId);

    const [surveys] = await pool.query(`
      SELECT 
        s.*,
        u.username as creator_name,
        (SELECT COUNT(*) FROM questions q WHERE q.survey_id = s.survey_id) as question_count,
        (SELECT COUNT(DISTINCT r.user_id) FROM responses r WHERE r.survey_id = s.survey_id) as response_count
      FROM surveys s 
      INNER JOIN users u ON s.creator_id = u.user_id 
      WHERE 
        s.creator_id != ? 
        AND NOT EXISTS (
          SELECT 1 
          FROM responses r 
          WHERE r.survey_id = s.survey_id 
          AND r.user_id = ?
        )
      ORDER BY s.created_at DESC
    `, [userId, userId]);

    console.log('查询结果:', {
      userId,
      surveysCount: surveys.length,
      surveys: surveys
    });

    res.json(surveys);
  } catch (error) {
    console.error('获取问卷列表失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

// 获取问卷详情
const getSurveyById = async (req, res) => {
  try {
    const { surveyId } = req.params;
    
    // 获取问卷基本信息
    const [surveys] = await pool.query(
      `SELECT s.*, u.username as creator_name 
       FROM surveys s 
       JOIN users u ON s.creator_id = u.user_id 
       WHERE s.survey_id = ?`,
      [surveyId]
    );

    if (surveys.length === 0) {
      return res.status(404).json({ error: '问卷不存在' });
    }

    const survey = surveys[0];

    // 获取问题
    const [questions] = await pool.query(
      `SELECT 
        q.question_id,
        q.question_text,
        q.question_type as type,
        q.required,
        q.question_order
       FROM questions q 
       WHERE q.survey_id = ?
       ORDER BY q.question_order`,
      [surveyId]
    );

    // 获取选项
    const [options] = await pool.query(
      `SELECT 
        o.option_id,
        o.question_id,
        o.option_text,
        o.option_order
       FROM options o
       JOIN questions q ON o.question_id = q.question_id
       WHERE q.survey_id = ?
       ORDER BY o.option_order`,
      [surveyId]
    );

    // 将选项关联到对应的问题
    const questionsWithOptions = questions.map(question => ({
      question_id: question.question_id,
      question_text: question.question_text,
      type: question.type,
      required: question.required,
      options: options.filter(option => option.question_id === question.question_id)
    }));

    survey.questions = questionsWithOptions;

    res.json(survey);
  } catch (error) {
    console.error('获取问卷详情失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

// 提交问卷回答
const submitResponse = async (req, res) => {
  let connection;
  try {
    const { surveyId } = req.params;
    const { answers } = req.body;
    const userId = req.user.userId;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 验证问卷是否存在
    const [survey] = await connection.query(
      'SELECT survey_id FROM surveys WHERE survey_id = ?',
      [surveyId]
    );

    if (survey.length === 0) {
      return res.status(404).json({ error: '问卷不存在' });
    }

    // 插入回答
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
    if (connection) {
      await connection.rollback();
    }
    console.error('提交问卷回答失败:', error);
    res.status(500).json({ error: '服务器错误' });
  } finally {
    if (connection) {
      connection.release();
    }
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
      WITH LastSubmissions AS (
        SELECT 
          survey_id,
          MAX(created_at) as last_submitted
        FROM responses
        WHERE user_id = ?
        GROUP BY survey_id
      )
      SELECT 
        s.survey_id,
        s.title,
        s.description,
        ls.last_submitted as submitted_at
      FROM surveys s
      JOIN LastSubmissions ls ON s.survey_id = ls.survey_id
      ORDER BY ls.last_submitted DESC
    `, [userId]);

    console.log('获取回答 - 用户ID:', userId);
    console.log('回答数量:', responses.length);

    res.json(responses);
  } catch (error) {
    console.error('获取用户回答失败:', error);
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

// 删除回答
const deleteResponse = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const userId = req.user.userId;

    await pool.query(
      'DELETE FROM responses WHERE survey_id = ? AND user_id = ?',
      [surveyId, userId]
    );

    res.json({ message: '回答删除成功' });
  } catch (error) {
    console.error('删除回答失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

// 删除问卷
const deleteSurvey = async (req, res) => {
  let connection;
  try {
    const { surveyId } = req.params;
    const userId = req.user.userId;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 检查问卷是否存在且属于当前用户
      const [survey] = await connection.query(
        'SELECT survey_id FROM surveys WHERE survey_id = ? AND creator_id = ?',
        [surveyId, userId]
      );

      if (survey.length === 0) {
        return res.status(403).json({ error: '无权限删除此问卷' });
      }

      // 删除相关的回答
      await connection.query(
        'DELETE FROM responses WHERE survey_id = ?',
        [surveyId]
      );

      // 删除问题的选项
      await connection.query(`
        DELETE o FROM options o
        JOIN questions q ON o.question_id = q.question_id
        WHERE q.survey_id = ?
      `, [surveyId]);

      // 删除问题
      await connection.query(
        'DELETE FROM questions WHERE survey_id = ?',
        [surveyId]
      );

      // 删除问卷
      await connection.query(
        'DELETE FROM surveys WHERE survey_id = ?',
        [surveyId]
      );

      await connection.commit();
      res.json({ message: '问卷删除成功' });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('删除问卷失败:', error);
    res.status(500).json({ error: '服务器错误' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// 获取问卷统计
const getSurveyStats = async (req, res) => {
  try {
    const { surveyId } = req.params;
    
    // 修改查询，添加 ORDER BY question_order
    const [questions] = await pool.query(`
      SELECT 
        q.question_id,
        q.question_text,
        q.question_type as type,
        q.question_order,
        o.option_id,
        o.option_text
      FROM questions q
      LEFT JOIN options o ON q.question_id = o.question_id
      WHERE q.survey_id = ?
      ORDER BY q.question_order, o.option_order
    `, [surveyId]);

    // 获取所有回答
    const [responses] = await pool.query(`
      SELECT 
        r.*,
        u.username
      FROM responses r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.survey_id = ?
    `, [surveyId]);

    // 统计数据初始化
    const stats = {
      totalRespondents: new Set(responses.map(r => r.user_id)).size,
      textResponses: [],
      choiceStats: []
    };

    // 按问题分组处理
    const groupedQuestions = {};
    questions.forEach(q => {
      if (!groupedQuestions[q.question_id]) {
        groupedQuestions[q.question_id] = {
          questionId: q.question_id,
          questionText: q.question_text,
          type: q.type,
          options: [],
          responses: []
        };
      }
      if (q.option_id) {
        groupedQuestions[q.question_id].options.push({
          optionId: q.option_id,
          text: q.option_text
        });
      }
    });

    // 添加回答到对应的问题
    responses.forEach(r => {
      if (groupedQuestions[r.question_id]) {
        groupedQuestions[r.question_id].responses.push({
          userId: r.user_id,
          username: r.username,
          answerText: r.answer_text,
          optionId: r.option_id
        });
      }
    });

    // 处理每个问题的统计
    Object.values(groupedQuestions).forEach(question => {
      if (question.type === 'TEXT') {
        stats.textResponses.push({
          questionId: question.questionId,
          questionText: question.questionText,
          answers: question.responses.map(r => ({
            username: r.username,
            text: r.answerText
          }))
        });
      } else {
        // 处理选择题（单选和多选）
        const totalResponses = new Set(question.responses.map(r => r.userId)).size;
        const optionCounts = {};
        
        // 初始化所有选项的计数为0
        question.options.forEach(opt => {
          optionCounts[opt.optionId] = 0;
        });

        // 统计选项计数
        question.responses.forEach(r => {
          if (question.type === 'MULTIPLE_CHOICE') {
            // 多选题处理
            if (r.answerText) {
              const selectedOptions = r.answerText.split(',');
              selectedOptions.forEach(optId => {
                if (optionCounts[optId] !== undefined) {
                  optionCounts[optId]++;
                }
              });
            }
          } else {
            // 单选题处理
            if (r.optionId && optionCounts[r.optionId] !== undefined) {
              optionCounts[r.optionId]++;
            }
          }
        });

        // 转换为前端需要的格式
        const options = question.options.map(opt => ({
          optionId: opt.optionId,
          text: opt.text,
          count: optionCounts[opt.optionId],
          percentage: Math.round((optionCounts[opt.optionId] / totalResponses) * 100) || 0
        }));

        stats.choiceStats.push({
          questionId: question.questionId,
          questionText: question.questionText,
          type: question.type,
          totalResponses,
          options
        });
      }
    });

    // 修改最终的统计数据排序
    const sortedStats = {
      totalRespondents: stats.totalRespondents,
      textResponses: stats.textResponses.sort((a, b) => {
        const orderA = questions.find(q => q.question_id === a.questionId)?.question_order || 0;
        const orderB = questions.find(q => q.question_id === b.questionId)?.question_order || 0;
        return orderA - orderB;
      }),
      choiceStats: stats.choiceStats.sort((a, b) => {
        const orderA = questions.find(q => q.question_id === a.questionId)?.question_order || 0;
        const orderB = questions.find(q => q.question_id === b.questionId)?.question_order || 0;
        return orderA - orderB;
      })
    };

    res.json(sortedStats);
  } catch (error) {
    console.error('获取问卷统计失败:', error);
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
  updateResponse,
  deleteResponse,
  deleteSurvey,
  getSurveyStats
}; 