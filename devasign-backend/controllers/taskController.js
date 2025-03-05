const Task = require('../models/Task');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

// @desc    Get all tasks
// @route   GET /api/v1/tasks
// @route   GET /api/v1/projects/:projectId/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
  try {
    let query;

    // Check if projectId is provided in params
    if (req.params.projectId) {
      // First check if user has access to this project
      const project = await Project.findById(req.params.projectId);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          error: `Project not found with id of ${req.params.projectId}`
        });
      }

      // Check if user is admin or owner or team member
      if (
        project.owner.toString() !== req.user.id &&
        req.user.role !== 'admin' &&
        !project.team.some(member => member.toString() === req.user.id)
      ) {
        return res.status(403).json({
          success: false,
          error: `User ${req.user.id} is not authorized to access tasks for this project`
        });
      }
      
      // Get all tasks for a specific project
      query = Task.find({ project: req.params.projectId });
    } else {
      // If admin, get all tasks
      if (req.user.role === 'admin') {
        query = Task.find();
      } else {
        // Get tasks where user is assigned or created or is project owner
        const projects = await Project.find({
          $or: [
            { owner: req.user.id },
            { team: req.user.id }
          ]
        }).select('_id');

        const projectIds = projects.map(project => project._id);

        query = Task.find({
          $or: [
            { assignedTo: req.user.id },
            { createdBy: req.user.id },
            { project: { $in: projectIds } }
          ]
        });
      }
    }

    // Add sort, populate, etc.
    const tasks = await query
      .populate({
        path: 'project',
        select: 'name'
      })
      .populate({
        path: 'assignedTo createdBy',
        select: 'name email'
      });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update task
// @route   PUT /api/v1/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task not found with id of ${req.params.id}`
      });
    }

    // Check if user has access to the project this task belongs to
    const project = await Project.findById(task.project);

    // Make sure user is admin or project owner or task creator
    if (
      req.user.role !== 'admin' &&
      project.owner.toString() !== req.user.id &&
      task.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: `User ${req.user.id} is not authorized to update this task`
      });
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete task
// @route   DELETE /api/v1/tasks/:id
// @access  Private
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task not found with id of ${req.params.id}`
      });
    }

    // Check if user has access to the project this task belongs to
    const project = await Project.findById(task.project);

    // Make sure user is admin or project owner or task creator
    if (
      req.user.role !== 'admin' &&
      project.owner.toString() !== req.user.id &&
      task.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: `User ${req.user.id} is not authorized to delete this task`
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single task
// @route   GET /api/v1/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate({
        path: 'project',
        select: 'name'
      })
      .populate({
        path: 'assignedTo createdBy',
        select: 'name email'
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task not found with id of ${req.params.id}`
      });
    }

    // Check if user has access to the project this task belongs to
    const project = await Project.findById(task.project);

    // Make sure user is admin or project owner or team member or task assignee or task creator
    if (
      req.user.role !== 'admin' &&
      project.owner.toString() !== req.user.id &&
      !project.team.some(member => member.toString() === req.user.id) &&
      task.assignedTo?.toString() !== req.user.id &&
      task.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: `User ${req.user.id} is not authorized to access this task`
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new task
// @route   POST /api/v1/projects/:projectId/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Add project and user to req.body
    req.body.project = req.params.projectId;
    req.body.createdBy = req.user.id;

    // Check if project exists
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: `Project not found with id of ${req.params.projectId}`
      });
    }

    // Make sure user is admin or project owner or team member
    if (
      req.user.role !== 'admin' &&
      project.owner.toString() !== req.user.id &&
      !project.team.some(member => member.toString() === req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        error: `User ${req.user.id} is not authorized to add tasks to this project`
      });
    }

    const task = await Task.create(req.body);

        res.status(201).json({
          success: true,
          data: task
        });
      } catch (err) {
        next(err);
      }
    };