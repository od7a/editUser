const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const userSchema= new mongoose.Schema({
    name:{
        type:String,
        trim:true,
        required:[true,'User name is required'],
    },
    slug:{
        type:String,
        lowercase:true
    },
    email:{
        type:String,
        required:[true,'Email is required'],
        unique:[true,'email alraedy exits'],
        lowercase:true
    },
    phone: String,
    profileImg: String,
    password:{
        type:String,
        required:[true,'password is required'],
        minlength:[6,'Too short password']
    },
    passwordChangedat:Date,
    passwordResetCode:String,
    passwordResetExpires:Date,
    passwordResetVerified:Boolean,
    role: {
        type: String,
        enum: ['user', 'manager', 'admin'],
        default: 'user',
      },
},{timestamps:true});


userSchema.pre('save',async function(next){
    //Hash user password
    this.password= await bcrypt.hash(this.password,12);
    next();
});



module.exports=mongoose.model('User',userSchema);