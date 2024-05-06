const { check } = require('express-validator');
const bcrypt=require('bcryptjs');
const validatorMiddleware = require('../../middelware/validatorMiddelware');
const User = require('../../models/userModel');

exports.getUserValidator = [
    check('id').isMongoId().withMessage('Invalid User id format'),
    validatorMiddleware,
];

exports.createUserValidator = [
    check('name')
        .trim()
        .notEmpty().withMessage('User name is required')
        .isLength({ min: 5 }).withMessage('User name must be at least 5 characters long'),

    check('email')
        .notEmpty().withMessage('Email required')
        .isEmail().withMessage('Invalid email address')
        .custom(email => {
            return User.findOne({ email }).then(user => {
                if (user) {
                    throw new Error('E-mail already in use');
                }
            });
        }),

    check('password')
        .notEmpty().withMessage('Password required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .custom((password,{req})=>{
            if(password!==req.body.passwordConfirm){
                throw new Error('password Confirmation incorrect');
            }
            return true;
        }),
    check('passwordConfirm')
    .notEmpty().withMessage('password confirmation required'),
    check('phone')
        .isMobilePhone('ar-EG').withMessage('Invaild phone number only accepted Egy phone numbers')
        .optional(),

    check('profileImg').optional(),
    check('role').optional(),

    validatorMiddleware,
];

exports.updateUserValidator = [
    check('id').isMongoId().withMessage('Invalid User id format'),
    check('name')
      .optional()
      .custom((val, { req }) => {
        req.body.slug = slugify(val);
        return true;
      }),check('email')
      .notEmpty().withMessage('Email required')
      .isEmail().withMessage('Invalid email address')
      .custom(email => {
          return User.findOne({ email }).then(user => {
              if (user) {
                  throw new Error('E-mail already in use');
              }
          });
      }),
  check('profileImg').optional(),
  check('role').optional(),
    validatorMiddleware,
];

exports.deleteUserValidator = [
    check('id').isMongoId().withMessage('Invalid User id format'),
    validatorMiddleware,
];
exports.changePasswordValidator = [
  check('id').isMongoId().withMessage('Invalid User id format'),
  check('currentpassword')
    .notEmpty()
    .withMessage('You must enter your current password'),
  check('passwordconfirm')
    .notEmpty()
    .withMessage('You must enter the password confirm'),
  check('password')
    .notEmpty()
    .withMessage('You must enter new password')
    .custom(async (val, { req }) => {
      // 1) Verify current password
      const user = await User.findById(req.params.id);
      if (!user) {
        throw new Error('There is no user for this id');
      }
      const isCorrectPassword = await bcrypt.compare(
        req.body.currentpassword,
        user.password
      );
      if (!isCorrectPassword) {
        throw new Error('Incorrect current password');
      }

      // 2) Verify password confirm
      if (val !== req.body.passwordconfirm) {
        throw new Error('Password Confirmation incorrect');
      }
      return true;
    }),
  validatorMiddleware,
];

exports.deleteUserValidator = [
  check('id').isMongoId().withMessage('Invalid User id format'),
  validatorMiddleware,
];