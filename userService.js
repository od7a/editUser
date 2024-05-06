const User=require('../models/userModel');
const slugify=require('slugify');
const asyncHandler = require('express-async-handler');
const ApiError=require('../utils/ApiError');
const sharp=require('sharp');
const{uploadSingleImage}=require('../middelware/uploadimageMiddelware');
const { v4: uuidv4, v1: uuidv1 } = require('uuid');
const bcrypt=require('bcryptjs');
//upload Image User
const uploadUserImage=uploadSingleImage('profileImg');
const resizeimage = asyncHandler(async (req, res, next) => {
    const filename = `user-${uuidv4()}-${Date.now()}.jpeg`;
    if(req.file){
        await sharp(req.file.buffer)
        .resize(600, 600) 
        .toFormat('jpeg') 
        .jpeg({ quality: 95 })
        .toFile(`uploads/users/${filename}`);
    req.body.profileImg = filename;

    }

        next();
});

//@desc get list of users
//@route Get /ap1/v1/user
//@acess  private
const getUsers=asyncHandler(async(req,res,next)=>{
    const users=await User.find();
    res.status(200).json({
        status: 'success',
        result: users.length,
        data: { users }
    });
})


//@desc get  user
//@route Get /ap1/v1/user/:id
//@acess  private
const getUser=asyncHandler(async(req,res,next)=>{
    const id= req.params.id;
    const user=await User.findById(id);
    if (!user) {
        return next(new ApiError(`No User found for this id ${id}`, 404));
    }
    res.status(200).json({ status: 'success', data: {user} });
})


//@desc create user
//@route post /ap1/v1/user
//@acess  private
const createUser=asyncHandler(async(req,res,next)=>{
    req.body.slug=slugify(req.body.name);
    const user =await User.create(req.body);
    res.status(201).json({ status: 'success', data: { user } });
})


//@desc update user
//@route patch /ap1/v1/user/:id
//@acess  private
const updateUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    // Update user using the provided data
    const user = await User.findByIdAndUpdate(
        id,
        {
            name: req.body.name,
            slug: req.body.slug,
            phone: req.body.phone,
            email: req.body.email,
            profileImg: req.body.profileImg,
            role: req.body.role,
          },
          {
            new: true,
          }// Return the updated object and run schema validators
    );


    // Check if the user was not found and return an error if so
    if (!user) {
        return next(new ApiError(`No user found for this ID: ${id}`, 404));
    }

    // If the user was found and updated, return the updated user data
    res.status(200).json({
        status: 'success',
        data: { user }
    });
});

const changepassword = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    // Update user using the provided data
    const user = await User.findByIdAndUpdate(
        id,
        {
            password: await bcrypt.hash(req.body.password,12),
            passwordChangedat:Date.now()
          },
          {
            new: true,
          }// Return the updated object and run schema validators
    );


    // Check if the user was not found and return an error if so
    if (!user) {
        return next(new ApiError(`No user found for this ID: ${id}`, 404));
    }

    // If the user was found and updated, return the updated user data
    res.status(200).json({
        status: 'success',
        data: { user }
    });
});



//@desc delete user
//@route delete /ap1/v1/user/:id
//@acess  private
const deleteUser=asyncHandler(async(req,res,next)=>{
    const id=req.params.id;
    const user=await User.findOneAndDelete(id);
    if (!user) {
        return next(new ApiError(`No User found for this id ${id}`, 404));
    }
    res.status(204).json({ message: "User Deleted" });
})


module.exports={
    uploadUserImage,
    resizeimage,
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    changepassword
}