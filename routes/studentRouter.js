const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const dotenv = require('dotenv').config()
const jwt = require('jsonwebtoken')
const { createjwt, verifyjwt } = require('../controllers.js/usersControllers')
// const {createjwt,verifyjwt}=require('../controllers.js/usersControllers')


// server/app.js

const multer = require('multer');
const path = require('path');


const BASEURL=process.env.SERVERBASEURL

// Define schema for audio recordings
const audioSchema = new mongoose.Schema({
    filename: String,
    path: String
});
const Audio = mongoose.model('Audio', audioSchema);

// Set up storage using multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// Route for handling file upload
router.route('/upload').get(upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    // File is uploaded successfully
    const filePath = req.file.path;
    console.log('File saved at:', filePath);

    // Save file path to MongoDB
    const audio = new Audio({ filename: req.file.originalname, path: filePath });
    await audio.save();
    

    res.status(200).json({ audioURL: `${SERVERBASEURL}/${filePath}` });
});



setInterval(async () => {
  try {
    const database = mongoose.connection.db;
    const collection = database.collection('student');

    const studentData = {
      isVerified: false
    };
    const result = await collection.deleteMany(studentData);

    if (result) {
      console.log("cleanup suceess...")
      // console.log(result)
    } else {
      console.log("fail to cleanup")
    }

  } catch (error) {
    console.error('Error occur while deleting students:', error);

  }
}, 600000)

const secret = process.env.SECRETKEY

router.route("/getUser").get(async (req, res) => {
  const { studentEmail } = req.query
  const token = jwt.sign(studentEmail, secret)
  res.json({ token: token })
})

router.route("/loginUser").get(async (req, res) => {
  const { token } = req.query
  const tokens = jwt.verify(token, secret)
  if (tokens) {
    console.log(tokens)
    res.json({ success: 'verified' })
  }

})


router.route('/verify-mobile').post(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('student');
    const { studentEmail, mobileID } = req.body;


    if (!studentEmail || !mobileID) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const studentData = {
      mobileID: mobileID.trim()

    };

    const filter = { studentEmail: studentEmail.trim() };
    const update = { $set: studentData };
    const options = { returnDocument: 'after' };

    const result = await collection.findOneAndUpdate(filter, update, options);

    if (result) {
      res.status(200).json({ updateID: "update successfull" });
    } else {
      res.status(404).json({ updateID: "data not found" });
    }


  } catch (error) {
    console.error('Error inserting student:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.route('/verify-laptop').post(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('student');
    const { studentEmail, laptopID } = req.body;

    // console.log(req.body)
    if (!studentEmail || !laptopID) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const studentData = {
      laptopID: laptopID.trim()

    };

    const filter = { studentEmail: studentEmail.trim() };
    const update = { $set: studentData };
    const options = { returnDocument: 'after' };

    const result = await collection.findOneAndUpdate(filter, update, options);

    if (result) {
      res.status(200).json({ updateID: "update successfull" });
    } else {
      res.status(404).json({ updateID: "data not found" });
    }


  } catch (error) {
    console.error('Error inserting student:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route("/addPenalty").post(async (req, res) => {
  try {
    // console.log('hi');
    console.log('Request Body:', req.body, typeof (req.body.courseID)); // Log request body

    // Check if required fields are present in the request body
    const { courseID, studentRoll, penalty } = req.body;
    if (!courseID || !studentRoll || !penalty) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Get database and collection
    const database = mongoose.connection.db;
    const collection = database.collection('student');

    // Find the student by roll number
    const student = await collection.findOne({ studentRoll: studentRoll.trim() });
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // console.log('Student:', student); // Log student data

    let courseFound = false;
    // Iterate over each semester's courses to find the correct course
    student.studentCourse.forEach(semester => {
      // console.log(semester)
      semester.courses.forEach(course => {
        if (course.courseID.trim() === courseID.trim()) {
          // Update the penalty for the course
          console.log(course.courseID)
          course.penalty = penalty;
          courseFound = true;
        }
        console.log(course.courseID, courseID, typeof (course.courseID))
      });
    });

    if (!courseFound) {
      return res.status(404).json({ message: 'Course not found for this student.' });
    }

    // Save the updated student data
    await collection.updateOne({ studentRoll: studentRoll.trim() }, { $set: student });

    return res.status(200).json({ message: 'Penalty updated successfully.' });
  } catch (error) {
    console.error('Error:', error); // Log error for debugging
    return res.status(500).json({ error: 'Internal Server Error' });
  }


})




router.route('/find').get(async (req, res) => {
  try {
    const database = mongoose.connection.db;
    const collection = database.collection('student');

    const queryParams = req.query; // Use req.query for GET requests



    const query = {};
    for (const [key, value] of Object.entries(queryParams)) {
      if (value == '' || value == null) {
        continue;
      }
      query[key] = value.trim();
    }

    // console.log("hii", query);


    const result = await collection.find(query).toArray();
    // console.log('rrr',result)
    res.status(200).json(result);

  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route('/searchCourses').get(async (req, res) => {
  try {
    const database = mongoose.connection.db;
    const collection = database.collection('student');

    const { studentEmail } = req.query;

    const filter = {
      studentEmail: studentEmail.trim()
    };

    const result = await collection.find(filter).toArray();

    if (result.length > 0) {
      const course = result[0].studentCourse;

      res.status(200).json(course);
    } else {
      // Send an empty array as the response
      res.status(200).json([]);
    }
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }


});


router.route('/login').get(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('student');
    const { studentEmail, studentPassword, studentDepartment } = req.query
    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
    try {
      var token = await createjwt(studentEmail, secret, expirationTime)
    } catch {
      // console.log('err')
    }

    // console.log('token',token)

    const result = await collection.find({
      studentEmail: studentEmail.trim(),
      studentPassword: studentPassword.trim(),
      studentDepartment: studentDepartment.trim()
    }).toArray();

    if (result) {
      var updatedData = await collection.updateOne({ studentEmail: studentEmail }, { $set: { token: token } })
    }

    // console.log('re',result,studentPassword)
    // console.log('u',updatedData)
    res.status(200).json(result);

  } catch (error) {
    // console.error('Error deleting faculty:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route('/logout').get(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('student');
    const { studentEmail } = req.query




    const result = await collection.find({
      studentEmail: studentEmail.trim(),
    }).toArray();

    if (result) {
      collection.updateOne({ studentEmail: studentEmail }, { $set: { token: null } })
    }
    res.status(200).json(result);

  } catch (error) {
    // console.error('Error deleting faculty:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.route('/add').post(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('student');
    const { name, email, studentRoll, phone, studentDepartment, studentCourse, studentDegree, studentAdmisionYear, studentGroup, studentSection } = req.body;

    // Validate required fields
    if (!name || !email || !studentRoll || !studentDepartment || !studentDegree || !studentAdmisionYear) {
      return res.status(400).json({ error: 'some fields are required' });
    }
    const studentData = {
      studentName: name.trim(),
      studentEmail: email.trim(),
      studentRoll: studentRoll.trim(),
      studentPhone: phone.trim(),
      studentDepartment: studentDepartment.trim(),
      //   studentSemester:semester,
      studentCourse: studentCourse,
      studentDegree: studentDegree.trim(),
      studentAdmissionYear: studentAdmisionYear.trim(),
      isVerified: false
      // studentGroup: studentGroup,
      // studentSection: studentSection
    };
    const find = collection.findOne({ studentEmail: studentEmail }).toArray();
    if (find.length > 0) {
      return
    }

    const result = await collection.insertOne(studentData);
    // console.log("insertion success")

    if (result) {
      // Respond with the inserted document's ID
      res.status(201).json({ insertedId: result.insertedId });
    } else {
      // Handle the case where the document was not inserted successfully
      res.status(500).json({ error: 'Failed to insert document' });
    }
  } catch (error) {
    console.error('Error inserting faculty:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.route('/register').post(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('student');
    const { studentName, studentEmail, studentRoll, studentPhone, studentDepartment, studentDegree, studentAdmissionYear, studentSex, mobileID, laptopID } = req.body;

    // Validate required fields
    // console.log(req.body)
    // console.log('say', studentAdmissionYear)

    if (!studentName || !studentEmail || !studentRoll || !studentDepartment || !studentDegree || !studentAdmissionYear || !studentSex || !studentPhone) {
      // console.log('hex')
      return res.status(400).json({ error: 'All fields are required' });
    }
    const studentData = {
      studentName: studentName.trim(),
      studentEmail: studentEmail.trim(),
      studentRoll: studentRoll.trim(),
      studentPhone: studentPhone.trim(),
      studentDepartment: studentDepartment.trim(),
      studentAdmissionYear: studentAdmissionYear.trim(),
      studentSex: studentSex.trim(),
      studentDegree: studentDegree.trim(),
      isVerified: false,
      mobileID: mobileID,
      laptopID: laptopID,
      // studentPassword: studentPassword

    };
    // console.log('hi')
    const ress = await collection.find({
      $or: [
        { studentEmail: studentEmail.trim() },
        { studentRoll: studentRoll.trim() }
      ]
    }).toArray()
    // console.log(ress)
    if (ress.length > 0) {
      // console.log("insertion fail")
      res.status(404).json({ Error: 'You have already registered' })
    } else {
      const result = await collection.insertOne(studentData);
      // console.log("insertion success")

      if (result) {
        // Respond with the inserted document's ID
        res.status(201).json({ insertedId: result.insertedId });
      } else {
        // Handle the case where the document was not inserted successfully
        res.status(500).json({ error: 'Failed to insert document' });
      }
    }


  } catch (error) {
    console.error('Error inserting student:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route('/remove').post(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('student');
    const { email, studentRoll } = req.body;

    // Validate required fields
    if (!email || !studentRoll) {
      // console.log(email, studentRoll)
      return res.status(400).json({ error: 'Email and roll number are required' });
    }

    // Create a document with the extracted fields
    const studentData = {
      studentEmail: email.trim(),
      studentRoll: studentRoll.trim()
    };
    const result = await collection.findOneAndDelete(studentData);

    if (result) {
      res.status(204).json({ deleteID: "delete successfull" });
    } else {
      res.status(404).json({ deleteID: "data not found" });
    }

  } catch (error) {
    // console.error('Error deleting faculty:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.route('/removeCourse').post(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('student');
    const { studentEmail, studentRoll, semester, courseID } = req.body;

    // Validate required fields
    console.log(req.body)
    if (!studentEmail || !studentRoll || !semester || !courseID) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Create a document with the extracted fields
    const filter = {
      studentEmail: studentEmail.trim(),
      studentRoll: studentRoll.trim(),
      'studentCourse.semester': semester.trim()
    }
    console.log('l')
    console.log(filter, 'k')
    const update = {
      $pull: {
        'studentCourse.$.courses': { courseID: courseID.trim() }
      }
    };
    const options = { returnDocument: 'after' };
    const result = await collection.findOneAndUpdate(filter, update, options);
    console.log(result)
    if (result) {
      res.status(204).json({ deleteID: "delete successfull" });
    } else {
      res.status(404).json({ deleteID: "data not found" });
    }

  } catch (error) {
    // console.error('Error deleting faculty:', error);
    res.status(500).json({ error: 'Internal Server Error' });
    console.log(error)
  }
});


router.route('/update').post(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('student');
    const { name, email, studentRoll, phone, studentDepartment, studentCourse, studentDegree, studentAdmisionYear } = req.body;

    // Validate required fields
    if (!email || !studentRoll) {
      return res.status(400).json({ error: 'Email and roll number are required' });
    }

    // Create a document with the extracted fields
    const studentData = {
      studentName: name.trim(),
      // studentEmail: email,
      // studentRoll:roll,
      studentPhone: phone.trim(),
      studentDepartment: studentDepartment.trim(),
      // studentSemester:semester,
      studentCourse: studentCourse.trim(),
      degree: studentDegree.trim(),
      studentAdmisionYear: studentAdmisionYear.trim()
    };

    const filter = { studentEmail: email.trim(), studentRoll: studentRoll.trim() };
    const update = { $set: studentData };
    const options = { returnDocument: 'after' };

    const result = await collection.findOneAndUpdate(filter, update, options);

    if (result) {
      res.status(200).json({ updateID: "update successfull" });
    } else {
      res.status(404).json({ updateID: "data not found" });
    }
    // Respond with the inserted document's ID

  } catch (error) {
    console.error('Error deleting :', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route('/update-profile').post(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('student');
    const queryParams = req.body; // Use req.query for GET requests


    console.log(queryParams)
    const query = {};
    let email = '';
    let studentRoll = ''
    for (const [key, value] of Object.entries(queryParams)) {
      if (value == '' || value == null) {
        continue;
      }
      if (key == 'studentRoll') {
        studentRoll = value;
        continue;
      }
      if (key == 'studentEmail') {
        email = value;
        continue;
      }
      query[key] = value.trim();
    }
    if (!email || !studentRoll) {
      return res.status(400).json({ error: 'Email and roll number are required' });
    }

    // Create a document with the extracted fields

    const filter = { studentEmail: email.trim(), studentRoll: studentRoll.trim() };
    const update = { $set: query };
    const options = { returnDocument: 'after' };

    const result = await collection.findOneAndUpdate(filter, update, options);

    if (result) {
      res.status(200).json({ updateID: "update successfull" });
    } else {
      res.status(404).json({ updateID: "data not found" });
    }
    // Respond with the inserted document's ID

  } catch (error) {
    console.error('Error deleting :', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.route('/changeDeviceFingerPrint').post(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('student');
    const { studentEmail, device } = req.body;

    // Validate required fields
    if (!studentEmail || !device) {
      return res.status(400).json({ error: 'Email and device  are required' });
    }

    // Create a document with the extracted fields
    if (device === 'Mobile') {
      var data = {
        mobileID: null
      };
    } else if (device === 'Laptop') {
      var data = {
        laptopID: null
      };
    }


    const filter = { studentEmail: studentEmail.trim() };
    const update = { $set: data };
    const options = { returnDocument: 'after' };

    const result = await collection.findOneAndUpdate(filter, update, options);

    if (result) {
      res.status(200).json({ updateID: "update successfull" });
    } else {
      res.status(404).json({ updateID: "data not found" });
    }
    // Respond with the inserted document's ID

  } catch (error) {
    console.error('Error deleting :', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route('/resetPasswords').post(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('student');
    const { studentEmail, studentPassword } = req.body;

    // Validate required fields
    if (!studentEmail || !studentPassword) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Create a document with the extracted fields
    const studentData = {
      studentPassword: studentPassword.trim()
    };

    const filter = { studentEmail: studentEmail.trim() };
    const update = { $set: studentData };
    const options = { returnDocument: 'after' };

    const result = await collection.findOneAndUpdate(filter, update, options);

    if (result) {
      res.status(200).json({ updateID: "update successfull" });
    } else {
      res.status(404).json({ updateID: "data not found" });
    }
    // Respond with the inserted document's ID

  } catch (error) {
    console.error('Error deleting :', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route('/readyForAttendanceByCourseID').post(async (req, res) => {
  try {
    // console.log("Data found");
    const database = mongoose.connection.db;
    const collection = database.collection('student');
    const { courseID, studentReadyForAttendance, studentAdmissionYear, studentDegree, studentDepartment } = req.body;


    if (!courseID || !studentAdmissionYear || !studentDegree) {
      // console.log("i'm")
      return res.status(400).json({ error: 'All fields are required' });
    }

    // console.log("rb",req.body)
    // Create a document with the extracted fields
    const studentData = {
      studentReadyForAttendance: studentReadyForAttendance

    };

    const filter = {
      studentAdmissionYear: studentAdmissionYear.trim(),
      'studentCourse.courses.courseID': courseID.trim(),
      // 'studentCourse': {
      //   $elemMatch: {
      //     'courses.courseID': courseID
      //   }
      // },
      //  studentGroup:studentGroup,
      //  studentSection:studentSection,
      // studentDepartment: studentDepartment.trim()
    };

    const update = { $set: studentData };
    const options = { returnDocument: 'after' };

    const result = await collection.updateMany(filter, update, { upsert: false, options });
    // console.log('k',result)
    if (result.modifiedCount) {
      res.status(200).json({ updateID: "update successful", updatedDocument: result });
    } else {
      res.status(404).json({ updateID: "data not found" });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }

});


router.route('/readyForAttendanceByGroupID').post(async (req, res) => {
  try {
    // console.log("Data found");
    const database = mongoose.connection.db;
    const collection = database.collection('student');
    const { courseID, studentReadyForAttendance, studentAdmissionYear, studentDegree, studentDepartment, studentGroup } = req.body;



    if (!courseID || !studentAdmissionYear || !studentDegree || !studentGroup) {
      return res.status(400).json({ error: 'All fields are required' });
    }


    // Create a document with the extracted fields
    const studentData = {
      // studentPhone:studentPhone,
      studentReadyForAttendance: studentReadyForAttendance
      // Add other fields if needed
    };

    const filter = {
      studentAdmissionYear: studentAdmissionYear.trim(),
      studentDegree: studentDegree.trim(),
      'studentCourse.studentGroup': studentGroup.trim(),
      'studentCourse.courses.courseID': courseID.trim(),
      //  studentSection:studentSection,
      // studentDepartment: studentDepartment.trim()
    };

    const update = { $set: studentData };
    const options = { returnDocument: 'after' };

    const result = await collection.updateMany(filter, update, { upsert: false, options });
    // console.log(result)
    if (result) {
      res.status(200).json({ updateID: "update successful", updatedDocument: result });
    } else {
      res.status(404).json({ updateID: "data not found" });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }

});


router.route('/readyForAttendanceBySectionID').post(async (req, res) => {
  try {
    // console.log("Data found");
    const database = mongoose.connection.db;
    const collection = database.collection('student');
    const { courseID, studentReadyForAttendance, studentAdmissionYear, studentDegree, studentDepartment, studentSection } = req.body;

    if (!courseID || !studentAdmissionYear || !studentDegree || !studentSection) {
      return res.status(400).json({ error: 'All fields are required' });
    }


    // Create a document with the extracted fields
    const studentData = {
      // studentPhone:studentPhone,
      studentReadyForAttendance: studentReadyForAttendance
      // Add other fields if needed
    };

    const filter = {
      studentAdmissionYear: studentAdmissionYear.trim(),
      studentDegree: studentDegree.trim(),
      'studentCourse.courses.courseID': courseID.trim(),
      //  studentGroup:studentGroup,
      'studentCourse.studentSection': studentSection.trim(),
      // studentDepartment: studentDepartment.trim()
    };

    const update = { $set: studentData };
    const options = { returnDocument: 'after' };

    const result = await collection.updateMany(filter, update, { upsert: false, options });
    // console.log('m',result,filter)
    if (result.matchedCount) {
      res.status(200).json({ updateID: "update successful", updatedDocument: result });
    } else {
      res.status(404).json({ updateID: "data not found" });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }

});

router.route('/courseRegistrationForNewSemester').post(async (req, res) => {
  try {
    // console.log("Data found");
    const database = mongoose.connection.db;
    const collection = database.collection('student');
    const { studentDegree, studentDepartment, studentEmail, studentRoll, semester, courses, studentGroup, studentSection } = req.body;

    if (!semester || !courses || !studentDegree || !studentDepartment || !studentSection || !studentGroup || !studentEmail || !studentRoll) {
      if(semester<7){
        return res.status(400).json({ error: 'All fields are required' });
      }
      
    }

    const existingStudent = await collection.findOne({
      studentDegree: studentDegree.trim(),
      studentDepartment: studentDepartment.trim(),
      studentRoll: studentRoll.trim(),
      'studentCourse.semester': semester.trim()
    });

    if (existingStudent) {
      return res.status(400).json({ error: 'You have already registered for this semester' });
    }

    // Create an object with the data to be added
    const courseData = {
      semester: semester.trim(),
      courses: courses,
      studentGroup: studentGroup.trim(),
      studentSection: studentSection.trim()
    };
    console.log(courseData);

    const filter = {
      studentDegree: studentDegree.trim(),
      studentDepartment: studentDepartment.trim(),
      studentRoll: studentRoll.trim(),
      studentEmail: studentEmail.trim()
    };

    const update = { $push: { studentCourse: courseData } };
    const options = { returnDocument: 'after' };

    const result = await collection.findOneAndUpdate(filter, update, options);
    // console.log(result);

    if (result) {
      res.status(200).json({ updateID: "update successful", updatedDocument: result });
    } else {
      res.status(404).json({ updateID: "data not found" });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }



});

router.route('/addNewCourses').post(async (req, res) => {
  try {
    // console.log("Data found");
    const database = mongoose.connection.db;
    const collection = database.collection('student');
    const { studentDegree, studentDepartment, studentEmail, studentRoll, semester, courses } = req.body;


    if (!semester || !courses || !studentDegree || !studentDepartment || !studentEmail || !studentRoll) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // const existingStudent = await collection.findOne({
    //   studentDegree: studentDegree.trim(),
    //   studentDepartment: studentDepartment.trim(),
    //   studentRoll: studentRoll.trim(),
    //   'studentCourse.semester': semester.trim()
    // });

    // if (existingStudent) {
    //   return res.status(400).json({ error: 'You have already registered for this semester' });
    // }

    // Create an object with the data to be added
    const courseData = {
      courses: courses,
    };
    console.log(courseData);

    const filter = {
      studentDegree: studentDegree.trim(),
      studentDepartment: studentDepartment.trim(),
      studentRoll: studentRoll.trim(),
      studentEmail: studentEmail.trim(),
      'studentCourse.semester': semester
    };

    const update = {
      $addToSet: {
        'studentCourse.$.courses': {
          $each: courses

        }
      }
    };
    const options = { returnDocument: 'after' };

    const result = await collection.findOneAndUpdate(filter, update, options);
    // console.log(result);

    if (result) {
      res.status(200).json({ updateID: "update successful", updatedDocument: result });
    } else {
      res.status(404).json({ updateID: "data not found" });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }



});

module.exports = router;
