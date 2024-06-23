const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'A user must have a email'],
    lowercase: true,
    unique: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: 8,
    select: false,
  },
  photo: String,
  passwordConfirm: {
    type: String,
    required: [true, 'A user must have a confirm password'],
    // This only works on CREATE and SAVE!!! ...
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message: 'Confirm Password must be the same as your password',
    },
  },
  passwordChangedAt: {
    type: Date,
    required: [true, 'A password must have a passwordChangedAt'],
    default: new Date(0)
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'tour-guide', 'lead-guide'],
    default: 'user',
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetTokenExpiredAt: {
    type: Date,
  },
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  console.log("candidate pass: ", candidatePassword);
  console.log("current pass: ", this.password);
  const res = await bcrypt.compare(candidatePassword, this.password);
  return res;
};

userSchema.pre('save', function (next){
  // if password has been changed OR first time creating pass, then update the passwordChangedAt
  if( this.isModified('password') || this.isNew('password') ){
    this.passwordChangedAt = Date.now();
  }
  next();
})

userSchema.methods.passwordChangedAfterToken = function (tokenIat) {
  console.log('passwordChangedAt: ', this.passwordChangedAt);
  const unixTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
  console.log('unix time: ', unixTimestamp); // Get the Unix timestamp in milliseconds
  console.log('token iat: ', tokenIat);
  return this.passwordChangedAt > tokenIat; // token iat is after password changed
};

// 'save' ? What are methods in mongoose correspoding to 'save' ??? xxxxxxxxxxxxxxx
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually changed modified
  if (!this.isModified('password')) {
    return next();
  }
  const hash = await bcrypt.hash(this.password, 12);
  this.password = hash;
  // Delete password confirmation !
  this.passwordConfirm = undefined;

  next();
});

userSchema.methods.createResetPasswordToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.passwordResetTokenExpiredAt = Date.now() + 10 * 60 * 1000;
  console.log({ token }, this.passwordResetToken);
  return token;
};

userSchema.verifyResetPasswordToken = function (userToken) {
  if (
    crypto.createHash('sha256').update(userToken).digest('hex') ===
    this.passwordResetToken
  ) {
    this.passwordResetToken = null;
    this.passwordResetTokenExpiredAt = null;
    this.passwordChangedAt = Date.now();
    return true;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
