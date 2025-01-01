const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createSurvey,
  getSurveys,
  getSurveyById,
  submitResponse
} = require('../controllers/surveyController');

router.post('/', auth, createSurvey);
router.get('/', getSurveys);
router.get('/:surveyId', getSurveyById);
router.post('/:surveyId/submit', auth, submitResponse);

module.exports = router; 