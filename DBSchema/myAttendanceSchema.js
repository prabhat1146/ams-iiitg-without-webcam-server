const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  adminID:{
    type: String
  },
  email: {
    type: String,
    required: true,
    match: [/^[a-zA-Z0-9.]+@iiitg\.ac\.in$/, 'Please enter a valid IIITG email address'],
  },
  phone: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    required: false,
  },
  
  password: {
    type: String,
    required: true,
    default: 'admin123', // Default value for the 'password' field
  },
  createdAt: {
    type: Date,
    default: Date.now, // Default value for the 'createdAt' field (current timestamp)
  },
});

const Admin = mongoose.model('Admin', adminSchema);

// const mongoose = require('mongoose');

// Faculty Schema
const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  facultyID:{
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^[a-zA-Z0-9.]+@iiitg\.ac\.in$/, 'Please enter a valid IIITG email address'],
  },
  department: {
    type: String,
    required: true,
  },
  sex:{
    type:String,
    require:false
  },
  phone: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    require:false,
    default: 'faculty123', // Default value for the 'password' field
  },
  isVerified:{
    type:Boolean,
    require:false
    
  },
  token:{
    type:String,
    require:false
  },
  facultyCourses:[
    {
      courseID:{
        type:String
      },
      courseName:{
        type:String
      },
      semester:{
        type:Number
      },
      degree:{
        type:String
      },
      department:{
        type:String
      },
      admissionYear:{
        type:Number
      }
    }
  ],
  
  createdAt: {
    type: Date,
    default: Date.now, // Default value for the 'createdAt' field (current timestamp)
  },
});

const Faculty = mongoose.model('Faculty', facultySchema);

// Course Schema
const courseSchema = new mongoose.Schema({
  courseID: {
    type: String,
    required: true,
    unique: true,
  },
  courseName: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  degree: {
    type: String,
    // required: true,
  },
  semester: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Default value for the 'createdAt' field (current timestamp)
  },
});

const Course = mongoose.model('Course', courseSchema);



const studentSchems = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
  },
  studentID:{
    type: String,
  },
  mobileID:{
    type:String,
  },
  laptopID:{
    type:String,
  },
  studentRoll: {
    type: Number,
    required: true,
  },
  studentEmail:{
    type:String,
    require:true,
    unique:true
  },
  isVerified:{
    type:Boolean,
    require:false
  },
  token:{
    type:String,
    require:false
  },
  studentDegree: {
    type: String,
    required: true,
  },
  studentDepartment: {
    type: String,
    required: true,
  },
  studentAdmissionYear: {
    type: String,
    required: true,
  },

 
  studentReadyForAttendance:{
    type:Boolean,
    require:true,
    default:false

  },
  studentSex:{
    type:String
  },
 
  studentCourse: [
    {
      semester: {
        type: Number,
        // required: true,
      },
      courses: [
        {
          courseID:{
            type:String
          },
          courseName:{
            type:String
          },
          penalty:{
            type:Number,
            default:0
          }
        }
      ],
      studentGroup:{
        type:String
      },
      studentSection:{
        type:String
      },
    },
  ],


  studentPhone:{
    type:Number
  },
  studentPassword:{
    type:String,
    require:true,
    default:"student123"
  },
  studentAddress:{
    type:String
  }

  createdAt: {
    type: Date,
    default: Date.now, // Default value for the 'createdAt' field (current timestamp)
  },
});


const Student = mongoose.model('Student', studentSchems);


attendanceSchema = {
  degree:{
    type:String,
    require:false
  },
  department:{
    type:String,
    type:false
  },
  courseName:{
    type:String,
    require:false
  },
  courseId:
  {
    type:String,
    require:false
  },
  studentAdmissionyear:{
    type:Number,
    require:false
  },
  studentSection:{
    type:String
  },

  studentGroup:{
    type:String
  },
  otp:{
    type:Number,
    require:false
  },
  semester: {
    type:Number,
    require:false
  },

  date: {
    type:Date,
    require:true,
    // default:Date.now
  },
  facultyEmail: {
    type:String,
    require:false
  }, // Reference to the Faculty collection
  facultyName: {
    type:String,
    require:false
  }, // Reference to the Faculty collection
   // Reference to the Courses collection
  timeSlot:{
    type:String,
    require:false
  },
  studentAttendances: [
    {
      studentRollNo:{
        type:Number,
        require:false
      }, 
      studentEmail:{
        type:String,
        require:false
      }, 
       
    },
    
  ],
  
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = { Admin,Faculty, Course,Student,Attendance };

