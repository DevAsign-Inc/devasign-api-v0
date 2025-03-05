const Project = require('../models/Project');
const { validationResult } = require('express-validator');

// @desc    Get all projects
// @route   GET /api/v1/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role === 'admin') {
      // If admin, get all projects
      const projects = await Project.find().populate({
        path: 'owner team',
        select: 'name email'
      });

      return res.status(200).json({
        success: true,
        count: projects.length,
        data: projects
      });
    }
    
    // If regular user, get projects where user is owner or team member
    const projects = await Project.find({
      $or: [
        { owner: req.user.id },
        { team: req.user.id }
      ]
    }).populate({
      path: 'owner team',
      select: 'name email'
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single project
// @route   GET /api/v1/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate({
        path: 'owner team',
        select: 'name email'
      })
      .populate('tasks');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: `Project not found with id of ${req.params.id}`
      });
    }

    // Make sure user is project owner or admin or team member
    if (
      project.owner.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      !project.team.some(member => member._id.toString() === req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        error: `User ${req.user.id} is not authorized to access this project`
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new project
// @route   POST /api/v1/projects
// @access  Private
exports.createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Add user to req.body as owner
    req.body.owner = req.user.id;

    const project = await Project.create(req.body);

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update project
// @route   PUT /api/v1/projects/:id
// @access  Private
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: `Project not found with id of ${req.params.id}`
      });
    }

    // Make sure user is project owner or admin
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: `User ${req.user.id} is not authorized to update this project`
      });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete project
// @route   DELETE /api/v1/projects/:id
// @access  Private
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: `Project not found with id of ${req.params.id}`
      });
    }

    // Make sure user is project owner or admin
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: `User ${req.user.id} is not authorized to delete this project`
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};