const express = require('express');
const { check } = require('express-validator');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');

// Include other resource routers
const taskRouter = require('./taskRoutes');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Re-route into other resource routers
router.use('/:projectId/tasks', taskRouter);

router
  .route('/')
  .get(protect, getProjects)
  .post(
    protect,
    [
      check('name', 'Project name is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('startDate', 'Start date is required').not().isEmpty()
    ],
    createProject
  );

router
  .route('/:id')
  .get(protect, getProject)
  .put(protect, updateProject)
  .delete(protect, deleteProject);

module.exports = router;