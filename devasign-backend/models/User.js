const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  stellarAddress: {
    type: String,
    required: [true, 'Stellar address is required'],
    unique: true,
    index: true
  },
  nonce: {
    type: String,
    default: () => Math.floor(Math.random() * 1000000).toString()
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profileImage: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id, stellarAddress: this.stellarAddress }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Generate a new nonce for the user
UserSchema.methods.generateNonce = function() {
  this.nonce = Math.floor(Math.random() * 1000000).toString();
  return this.nonce;
};

// Update last login timestamp
UserSchema.methods.updateLastLogin = function() {
  this.lastLogin = Date.now();
  return this.lastLogin;
};

module.exports = mongoose.model('User', UserSchema);