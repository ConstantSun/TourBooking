const jwt = require('jsonwebtoken');
// const jwtDecode = require('jwt-decode');
const { promisify } = require('util');
const crypto = require('crypto');
const sendEmail = require('../utils/email');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}
const createSendToken = (user, statusCode, res)=>{
  const token = signToken(user._id);
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: false, // HTTPS only
  };
  if (process.env.NODE_ENV === 'production') 
    options.secure=true;

  res.cookie('jwt', token, options);
  user.password = undefined;
  res.status(statusCode).json({
    status: 'successs',
    token,
    data: {
      user,
    },
  });
}

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser,201,res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // check if there is email, password
  if (!email || !password) {
    next(new AppError('please provide email and password!', 400));
  }
  // check if email, password is correct or not
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Email does not exist', 400));
  }
  // check if password is correct
  console.log(user);
  const isPasswordValid = await user.comparePassword(password);
  if (isPasswordValid) {
    const token = signToken(user._id);
    res.status(201).json({
      status: 'sucess',
      token: token,
    });
  } else {
    next(new AppError('wrong pass, try again', 400));
  }
});

exports.protect = catchAsync(async (req, res, next) => {
  // verify token absent
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // console.log('token: ', token);
    // console.log('header:\n', req.headers);
  }
  if (!token) {
    next(new AppError('auth token not found, please log in'));
  }
  // Verify token valid or not
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // check if token is correct and valid
  if (!decode) {
    next(new AppError('Token is invalid'));
  }

  // verify if user exists or not
  const currentUser = await User.findById(decode.id);
  if (!currentUser) {
    next(new AppError('Token belongs to an un-existed User'));
  }
  // verify if user has changed password within now->expired time or not
  if (!currentUser.passwordChangedAfterToken(decode.iat)) {
    next(new AppError('Password has been changed, pls log in again!'));
  }
  // Grant access to protected Route
  req.user = currentUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.include(req.user.role)) {
      return next(new AppError('You are not allowed to do this', 403));
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // check email exist or not
  console.log('hii .... ');
  const { email } = req.body;
  console.log({ email });
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('Email is not existed', 401));
  }
  // create reset token
  const resetToken = user.createResetPasswordToken();

  await user.save({ validateBeforeSave: false }); // NOTE: REMEMBER TO SAVE !!!
  console.log(user);
  console.log(resetToken);

  // send email 
  try {
    await sendEmail({
      receiverMail: 'hyperdoo12@john.io',
      subject: 'Reset password token (valid for 10mins) for Natours',
      message: `Please go to this link to reset your password: ${req.protocol}://${req.hostname}:3000/api/v1/users/resetPassword/${resetToken}`,
    });
    console.log('sending email successfully ');
    res.status(201).json({
      status: 'sucess',
      resetToken: resetToken,
    });
    next();
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiredAt = undefined;
    await user.save({ validateBeforeSave: false });
    return new AppError(
      'There was an error when sending email. Try again latter',
      500,
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // check if token is correct and valid
  const { resetToken } = req.params;
  const user = await User.findOne({
    passwordResetToken: crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex'),
  });
  if (!user || user.passwordResetTokenExpiredAt <= Date.now()) {
    return next(new AppError('Invalid reset password token !'));
  }

  // update password for user
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  // user.passwordChangedAt = Date.now(); // already implemented in User methods with pre hook
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiredAt = undefined; 
  await user.save();

  // log user in
  res.status(201).json({
    status: 'success',
    message: 'password is updated!',
    token: signToken(user._id),
  });
});

exports.updatePassword = async (req, res, next)=>{
  // get user with pass
  const user = await User.findById(req.user._id).select('+password');
  // check token with protect()
  const isPassCorrect = await user.comparePassword(req.body.currentPassword);
  // check current password is correct or not

  // save new pass & pass confirm, pass changed at
  if(!isPassCorrect){
    return next(new AppError('Wrong password, please try again !'));
  };
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  user.save(); // compare passwordConfirm, encrypt pass, update pass changed at
  // log user in w token, -> res.s..201
  res.status(201).json({
    status: 'success',
    token: signToken(user._id),
    message: 'password is updated successfully',
  });

}