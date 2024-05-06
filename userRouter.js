const userService=require('../service/userService');
const authService=require('../service/authService');
const{getUserValidator,createUserValidator,updateUserValidator,deleteUserValidator,changePasswordValidator}=require('../utils/validator/userValidator');
const express=require('express');
const router=express.Router();
router.route('/changedpassword/:id').patch(changePasswordValidator,userService.changepassword);
router.route('/')
      .get(authService.protect,authService.allowedTo("admin","manager"),userService.getUsers)
      .post(authService.protect,authService.allowedTo("admin"),userService.uploadUserImage,userService.resizeimage,createUserValidator,userService.createUser)
router.route('/:id')
      .get(authService.protect,authService.allowedTo("admin","manager"),getUserValidator,userService.getUser)
      .patch(authService.protect,authService.allowedTo("admin"),updateUserValidator,userService.updateUser)
      .delete(authService.protect,authService.allowedTo("admin"),deleteUserValidator,userService.deleteUser)
module.exports=router;