const express = require('express');
const { check } = require('express-validator');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getTasks)
  .post(
    protect,
    [
      check('title', 'Task title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('dueDate', 'Due date is required').not().isEmpty()
    ],
    createTask
  );

router
  .route('/:id')
  .get(protect, getTask)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

module.exports = router;