const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const User = require('../models/userModel');
const sendEmail=require('../utils/sendEmail')
// @desc    Signup
// @route   GET /api/v1/auth/signup
// @access  Public
exports.signUp = asyncHandler(async (req, res, next) => {
    // 1- Create user
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role:req.body.role
    });
  
    // 2- Generate token
    const token = jwt.sign({userId:user._id},process.env.JWT_SECRET_KEY,{expiresIn:"6h"});
  
    res.status(201).json({ data: user, token });
  });
  
  // @desc    Login
  // @route   GET /api/v1/auth/login
  // @access  Public
  exports.Login = asyncHandler(async (req, res, next) => {
    // 1) check if password and email in the body (validation)
    // 2) check if user exist & check if password is correct
    const user = await User.findOne({ email: req.body.email });
  
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return next(new ApiError('Incorrect email or password', 401));
    }
    // 3) generate token
    const token = jwt.sign({userId:user._id},process.env.JWT_SECRET_KEY,{expiresIn:"6h"});
    // 4) send response to client side
    res.status(200).json({ data: user, token });
  });
  
  // @desc   make sure the user is logged in
  exports.protect = asyncHandler(async (req, res, next) => {
    // 1) Check if token exist, if exist get
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return next(
        new ApiError(
          'You are not login, Please login to get access this route',
          401
        )
      );
    }
  
    // 2) Verify token (no change happens, expired token)
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  
    // 3) Check if user exists
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return next(
        new ApiError(
          'The user that belong to this token does no longer exist',
          401
        )
      );
    }
  
    // 4) Check if user change his password after token created
    if (currentUser.passwordChangedAt) {
      const passChangedTimestamp = parseInt(
        currentUser.passwordChangedAt.getTime() / 1000,
        10
      );
      // Password changed after token created (Error)
      if (passChangedTimestamp > decoded.iat) {
        return next(
          new ApiError(
            'User recently changed his password. please login again..',
            401
          )
        );
      }
    }
  
    req.user = currentUser;
    next();
  });
 // @desc   User permissions
  exports.allowedTo = (...roles) => asyncHandler(async (req, res, next) => {
    // Check if the roles array includes the user's role
    if (!roles.includes(req.user.role)) {
        // If the user's role is not included in the roles, return an error response
        return res.status(403).json({
            message: "You are not allowed to access this route"
        });
    }
    // If the user's role is allowed, proceed to the next middleware
    next();
});
 
 // @desc   Forget Password 
 exports.forgetpassword=asyncHandler(async(req,res,next)=>{
 //1)Get user-->email
 const user=await User.findOne({email:req.body.email});
 if(!user){
  return next(
    new ApiError("There is no User with that E-mail"),
    404
  )
 }
 //2)if exist user,Genrate hash reset code (randam 6 digits) and save in db
 const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
 const hashResetcode = crypto.createHash('sha256')
                             .update(resetCode)
                             .digest('hex');
  //save hashed Reset code in db
    // Save hashed password reset code into db
    user.passwordResetCode = hashResetcode;
    // Add expiration time for password reset code (10 min)
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    user.passwordResetVerified = false;
  
    await user.save();
  
  // 3) Send the reset code via email
  const message = `Hi ${user.name},\n We received a request to reset the password on your E-shop Account. \n ${resetCode} \n Enter this code to complete the reset. \n Thanks for helping us keep your account secure.\n The E-shop Team`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset code (valid for 10 min)',
      message,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;

    await user.save();
    return next(new ApiError('There is an error in sending email' , 500));
  }

  res
    .status(200)
    .json({ status: 'Success', message: 'Reset code sent to email' });
});



 