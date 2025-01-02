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
  updateResponse,
  deleteResponse,
  deleteSurvey
} = require('../controllers/surveyController');

router.post('/', auth, createSurvey);
router.get('/', getSurveys);
router.get('/my-surveys', auth, getMySurveys);
router.get('/my-responses', auth, getMyResponses);
router.get('/:surveyId', getSurveyById);
router.get('/:surveyId/my-response', auth, getSurveyResponse);
router.post('/:surveyId/submit', auth, submitResponse);
router.put('/:surveyId/response', auth, updateResponse);
router.delete('/:surveyId/response', auth, deleteResponse);
router.delete('/:surveyId', auth, deleteSurvey);

module.exports = router; 