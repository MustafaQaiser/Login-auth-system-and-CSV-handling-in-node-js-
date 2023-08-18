
const mongoose = require('mongoose');
const Moongo_Uri='mongodb+srv://mustafa:mustafa@cluster0.3rsyqou.mongodb.net/'
const connectDB = async () => {
  try {
    await mongoose.connect(Moongo_Uri, {
      
      useNewUrlParser: true,
      useUnifiedTopology: true,
     
    });
    console.log('mongodb connection success!');
  } catch (err) {
    console.log('mongodb connection failed!', err.message);
  }
};

module.exports = connectDB;