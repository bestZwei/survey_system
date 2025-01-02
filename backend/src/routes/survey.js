const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createSurvey,
  getSurveys,
  getSurveyById,
  submitResponse,
  getMySurveys,
  getMyResponses,
  getSurveyResponse,
  updateResponse
} = require('../controllers/surveyController');

router.post('/', auth, createSurvey);
router.get('/', getSurveys);
router.get('/my-surveys', auth, getMySurveys);
router.get('/my-responses', auth, getMyResponses);
router.get('/:surveyId', getSurveyById);
router.get('/:surveyId/my-response', auth, getSurveyResponse);
router.post('/:surveyId/submit', auth, submitResponse);
router.put('/:surveyId/response', auth, updateResponse);

module.exports = router; 