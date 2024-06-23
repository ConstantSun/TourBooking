const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');

exports.getUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(201).json({
    status: 'success',
    data: {
      users,
    },
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'fail',
    data: {
      status: 'fail',
      message: 'Undefined api',
    },
  });
};

exports.addUser = (req, res) => {
  res.status(500).json({
    status: 'fail',
    data: {
      status: 'fail',
      message: 'Undefined api',
    },
  });
};

exports.updateUser = (req, res) => {
  res.status(401).json({
    status: 'fail',
    data: {
      status: 'fail',
      message: 'Un-defined API',
    },
  });
};

exports.deleteUser = (req, res) => {
  res.status(204).json({
    // No Content success
    status: 'success',
    data: null,
  });
};
