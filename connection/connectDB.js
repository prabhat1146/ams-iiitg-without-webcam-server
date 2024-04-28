// db.js

const mongoose = require('mongoose');

// Replace 'your_database_name' with the name of your MongoDB database
const BASEURL=process.env.REACT_APP_BASEURL
// const DB_URI = `mongodb://localhost:27017/myAttendance`;
const DB_URI = process.env.MONGODB_URI;
console.log(DB_URI)

const connectDB = async () => {
  try {
    await mongoose.connect(DB_URI,);

    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Connection to MongoDB failed:', error.message);
    // process.exit(1);
  }
};

module.exports = { connectDB, mongoose };
