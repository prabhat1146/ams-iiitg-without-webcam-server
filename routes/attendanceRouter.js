
const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');


setInterval(async()=>{
  try {
    const database = mongoose.connection.db;
    const collection = database.collection('attendance');
   
    const studentData = {
      $or: [
        { studentAttendances: { $exists: false } }, // Documents where studentAttendances field does not exist
        { $expr: { $eq: [{ $size: { $ifNull: ["$studentAttendances", []] } }, 0] } } // Documents where studentAttendances field exists but its size is 0
      ]
    };
    const result = await collection.deleteMany(studentData);

    if(result){
      console.log("cleanup suceess...")
      console.log(result)
    }else{
      console.log("fail to cleanup")
    }

  } catch (error) {
    console.error('Error occur while deleting(cleanup-process i.e having 0 students) attendance data:', error);
   
  }
},86400000)

router.route('/find').get(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('attendance');

    const queryParams=req.query

    // console.log('q',queryParams)

    const query = {};
    for (const [key, value] of Object.entries(queryParams)) {
      if (value == '') {
        continue
      }
      query[key] = value.trim();
    }

    const result = await collection.find(query).toArray();

    // console.log(result)

    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ deleteID: "data not found" });
    }

  } catch (error) {
    // console.error('Error deleting faculty:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route('/attendanceData').get(async (req, res) => {
  try {

    // console.log('r',req.query)
    const database = mongoose.connection.db;
    const collection = database.collection('attendance');
    const {studentEmail,studentAdmissionYear,courseID}=req.query
    

    if(!studentEmail || !studentAdmissionYear || !courseID){
      // console.log('rl')
      return res.status(404).json({error:'All field required'})
    }

    // console.log('rr',req.query)
    
    const filter={
      courseID:courseID.trim(),
      studentAdmissionYear:studentAdmissionYear.trim(),
      'studentAttendances.studentEmail':studentEmail.trim()
    }

    const result = await collection.find(filter).toArray();
    // console.log('1',result)

    if (result) {
      res.status(200).json({present:result.length});
    } else {
      res.status(404).json({ present:0 });
    }

  } catch (error) {
    // console.error('Error deleting faculty:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route('/attendanceTotalData').get(async (req, res) => {
  try {

    // console.log('r',req.query)
    const database = mongoose.connection.db;
    const collection = database.collection('attendance');
    const queryParams=req.query
    // console.log('q',queryParams)
    const query = {};
    for (const [key, value] of Object.entries(queryParams)) {
      if (value == '' || value==null) {
        continue
      }
      query[key] = value.trim();
    }
  

    const result = await collection.find(query).toArray();
    // console.log('1',result)

    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({error:'Not found'});
    }

  } catch (error) {
    // console.error('Error deleting faculty:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route('/liveClasses').get(async (req, res) => {
  try {

    // console.log('r',req.query)
    const database = mongoose.connection.db;
    const collection = database.collection('attendance');
    const {date,timeSlot}=req.query
    

    if(!date || !timeSlot){
      // console.log('rl')
      return res.status(404).json({error:'All field required'})
    }

    // console.log('rr',req.query)
    
    const filter={
      date:date.trim(),
      timeSlot:timeSlot.trim()  
    }

    const result = await collection.find(filter).toArray();
    // console.log('1',result)

    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({error:'Not found'});
    }

  } catch (error) {
    // console.error('Error deleting faculty:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.route('/initiate').post(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('attendance');
    const { degree, department, courseName, courseID, studentAdmissionyear, semester, facultyEmail, facultyName, timeSlot, studentGroup, studentSection, date } = req.body;

    // Validate required fields
    // console.log(req.body)
    if (!degree || !department || !courseName || !courseID || !studentAdmissionyear || !semester || !facultyEmail || !facultyName || !timeSlot || !date) {
      return res.status(400).json({ error: 'All fields are required' });
    }


    // Create a document with the extracted fields
    const attendanceData = {
      degree: degree.trim(),
      department: department.trim(),
      courseID: courseID.trim(),
      courseName: courseName,
      studentAdmissionYear: studentAdmissionyear.trim(),
      semester: semester.trim(),
      facultyEmail: facultyEmail.trim(),
      facultyName: facultyName.trim(),
      timeSlot: timeSlot.trim(),
      studentGroup: studentGroup.trim(),
      studentSection: studentSection.trim(),
      date: date.trim()
    };
    // console.log("insertion success")
    // const result = await collection.updateOne({attendanceData},{$set:{attendanceData}},{upsert:true});

    const ress = await collection.findOne(attendanceData);
    if (!ress) {
      var result = await collection.insertOne(attendanceData);
    }

    // console.log(result)
    if (result) {
      // Respond with the inserted document's ID
      res.status(201).json({ insertedId: result.insertedId });
    } else {
      // Handle the case where the document was not inserted successfully
      res.status(500).json({ error: 'Failed to insert document' });
      
    }
  } catch (error) {
    // console.log(error)
    // console.error('Error inserting faculty:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route('/setOtpByCourseID').post(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('attendance');
    const { courseID, otp, facultyEmail, date, timeSlot, studentAdmissionyear } = req.body;

    // Validate required fields

    if (!courseID || !facultyEmail || !otp || !date || !timeSlot || !studentAdmissionyear) {
      
      return res.status(400).json({ error: 'some fields are required' });
    }


    // Create a document with the extracted fields
    const attendanceData = {
      otp: otp,
    };
    const filter = {
      facultyEmail: facultyEmail.trim(),
      courseID: courseID.trim(),
      date: date.trim(),
      timeSlot: timeSlot.trim(),
      studentAdmissionYear: studentAdmissionyear.trim()
    };
    const update = { $set: attendanceData };
    const options = { returnDocument: 'after' };

    const result = await collection.findOneAndUpdate(filter, update, options);

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


router.route('/makeAttendanceByCourseID').post(async (req, res) => {
  try {
    const database = mongoose.connection.db;
    const collection = database.collection('attendance');
    const { courseID, otp, date, timeSlot, studentRollNo, studentEmail, degree, department } = req.body;
  
    // Validate required fields
    if (!courseID || !otp || !date || !timeSlot || !studentRollNo || !studentEmail || !degree) {
      return res.status(400).json({ error: 'Some fields are required' });
    }
  
    // Step 1: Check for duplicates based on the provided data
    const duplicateCheckFilter = {
      courseID: courseID.trim(),
      date: date.trim(),
      timeSlot: timeSlot.trim(),
      otp: otp.trim(),
      degree: degree.trim(),
      // department: department.trim(),
      'studentAttendances.studentRollNo': studentRollNo.trim(),
      'studentAttendances.studentEmail': studentEmail.trim()
    };
  
    const existingDocument = await collection.findOne(duplicateCheckFilter);
  
    if (existingDocument) {
      // console.log('202')
      return res.status(202).json({ message: 'Data already exists' });
    }
  
    // Step 2: Validate student based on different data
    const studentValidationFilter = {
      courseID: courseID.trim(),
      date: date.trim(),
      timeSlot: timeSlot.trim(),
      otp: otp.trim(),
      degree: degree.trim(),
      // department: department.trim()
      // Add more conditions if needed for student validation
    };
  

    const isStudentValidated = await collection.findOne(studentValidationFilter);
  
    if (!isStudentValidated) {
      // console.log('404')
      return res.status(404).json({ error: 'Student validation failed' });
    }
  
    // Step 3: Update attendance with new data if validation is successful
    const newAttendanceData = {
      "studentAttendances": [
        {
          "studentRollNo": studentRollNo.trim(),
          "studentEmail": studentEmail.trim()
        }
        // Add more student attendance records as needed
      ]
    };
  
    const updateFilter = {
      courseID: courseID.trim(),
      date: date.trim(),
      timeSlot: timeSlot.trim(),
      otp: otp.trim(),
      degree: degree.trim(),
      // department: department.trim()
    };
  
    const updateResult = await collection.updateOne(
      updateFilter,
      { $addToSet: { "studentAttendances": { $each: newAttendanceData.studentAttendances } } },
      { upsert: false } // Set to false since you only want to update, not insert
    );
  
    if (updateResult) {
      // Document was updated successfully
      res.status(200).json({ message: 'Document updated successfully' });
    } else {
      // No documents matched the update criteria
      // console.log('40')
      res.status(404).json({ error: 'No matching document found for update' });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
  

});



router.route('/setOtpByGroupID').post(async (req, res) => {
  try {

    // console.log('running')
    const database = mongoose.connection.db;
    const collection = database.collection('attendance');
    const { courseID, otp, facultyEmail, date, timeSlot, studentGroup, studentAdmissionyear } = req.body;

    // Validate required fields

    if (!courseID || !facultyEmail || !otp || !date || !timeSlot || !studentGroup || !studentAdmissionyear) {

      return res.status(400).json({ error: 'some fields are required' });
    }
    
    // Create a document with the extracted fields
    const attendanceData = {
      otp: otp.trim(),
    };
    const filter = {
      facultyEmail: facultyEmail.trim(),
      courseID: courseID.trim(),
      date: date.trim(),
      timeSlot: timeSlot.trim(),
      studentGroup: studentGroup.trim(),
      studentAdmissionYear: studentAdmissionyear.trim()
    };
    const update = { $set: attendanceData };
    const options = { returnDocument: 'after' };

    const result = await collection.findOneAndUpdate(filter, update, options);

    if (result) {
      // Respond with the inserted document's ID
      res.status(201).json({ insertedId: result.insertedId });
    } else {
      // Handle the case where the document was not inserted successfully
      res.status(500).json({ error: 'Failed to insert document' });
    }
  } catch (error) {
    // console.error('Error inserting faculty:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.route('/makeAttendanceByGroupID').post(async (req, res) => {
  try {
    const database = mongoose.connection.db;
    const collection = database.collection('attendance');
    const { courseID, otp, date, timeSlot, studentRollNo, studentEmail, degree, department,studentGroup } = req.body;
  
    // Validate required fields
    if (!courseID || !otp || !date || !timeSlot || !studentRollNo || !studentEmail || !degree  || !studentGroup) {
      return res.status(400).json({ error: 'Some fields are required' });
    }
  
    // Step 1: Check for duplicates based on the provided data
    const duplicateCheckFilter = {
      courseID: courseID.trim(),
      date: date.trim(),
      timeSlot: timeSlot.trim(),
      otp: otp.trim(),
      degree: degree.trim(),
      // department: department.trim(),
      studentGroup:studentGroup.trim(),
      'studentAttendances.studentRollNo': studentRollNo.trim(),
      'studentAttendances.studentEmail': studentEmail.trim()
    };
  
    const existingDocument = await collection.findOne(duplicateCheckFilter);
  
    if (existingDocument) {
      // console.log('202')
      return res.status(202).json({ message: 'Data already exists' });
    }
  
    // Step 2: Validate student based on different data
    const studentValidationFilter = {
      courseID: courseID.trim(),
      date: date.trim(),
      timeSlot: timeSlot.trim(),
      otp: otp.trim(),
      degree: degree.trim(),
      // department: department.trim(),
      studentGroup:studentGroup.trim()
      // Add more conditions if needed for student validation
    };
  

    const isStudentValidated = await collection.findOne(studentValidationFilter);
  
    if (!isStudentValidated) {
      // console.log('404')
      return res.status(404).json({ error: 'Student validation failed' });
    }
  
    // Step 3: Update attendance with new data if validation is successful
    const newAttendanceData = {
      "studentAttendances": [
        {
          "studentRollNo": studentRollNo.trim(),
          "studentEmail": studentEmail.trim()
        }
        // Add more student attendance records as needed
      ]
    };
  
    const updateFilter = {
      courseID: courseID.trim(),
      date: date.trim(),
      timeSlot: timeSlot.trim(),
      otp: otp.trim(),
      degree: degree.trim(),
      // department: department.trim(),
      studentGroup:studentGroup.trim()
    };
  
    const updateResult = await collection.updateOne(
      updateFilter,
      { $addToSet: { "studentAttendances": { $each: newAttendanceData.studentAttendances } } },
      { upsert: false } // Set to false since you only want to update, not insert
    );
  
    if (updateResult) {
      // Document was updated successfully
      res.status(200).json({ message: 'Document updated successfully' });
    } else {
      // No documents matched the update criteria
      // console.log('40')
      res.status(404).json({ error: 'No matching document found for update' });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
  

});




router.route('/setOtpBySectionID').post(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('attendance');
    const { courseID, otp, facultyEmail, date, timeSlot, studentSection, studentAdmissionyear } = req.body;

    // Validate required fields
    // console.log('r',req.body)

    if (!courseID || !facultyEmail || !otp || !date || !timeSlot || !studentSection || !studentAdmissionyear) {
     
      return res.status(400).json({ error: 'some fields are required' });
    }


    // Create a document with the extracted fields
    const attendanceData = {
      otp: otp,
    };
    const filter = {
      facultyEmail: facultyEmail.trim(),
      courseID: courseID.trim(),
      date: date.trim(),
      timeSlot: timeSlot.trim(),
      studentSection: studentSection.trim(),
      studentAdmissionYear: studentAdmissionyear.trim()
    };
    const update = { $set: attendanceData };
    const options = { returnDocument: 'after' };

    const result = await collection.findOneAndUpdate(filter, update, options);

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

router.route('/makeAttendanceBySectionID').post(async (req, res) => {
  try {
    const database = mongoose.connection.db;
    const collection = database.collection('attendance');
    const { courseID, otp, date, timeSlot, studentRollNo, studentEmail, degree, department , studentSection} = req.body;
  
    // Validate required fields
    // console.log(req.body)
    if (!courseID || !otp || !date || !timeSlot || !studentRollNo || !studentEmail || !degree || !studentSection) {
      return res.status(400).json({ error: 'Some fields are required' });
    }
  
    // Step 1: Check for duplicates based on the provided data
    const duplicateCheckFilter = {
      courseID: courseID.trim(),
      date: date.trim(),
      timeSlot: timeSlot.trim(),
      otp: otp.trim(),
      degree: degree.trim(),
      // department: department.trim(),
      studentSection:studentSection.trim(),
      'studentAttendances.studentRollNo': studentRollNo.trim(),
      'studentAttendances.studentEmail': studentEmail.trim()
    };
  
    const existingDocument = await collection.findOne(duplicateCheckFilter);
  
    if (existingDocument) {
      // console.log('202')
      return res.status(202).json({ message: 'Data already exists' });
    }
  
    // Step 2: Validate student based on different data
    const studentValidationFilter = {
      courseID: courseID.trim(),
      date: date.trim(),
      timeSlot: timeSlot.trim(),
      otp: otp.trim(),
      degree: degree.trim(),
      // department: department.trim(),
      studentSection:studentSection.trim()
      // Add more conditions if needed for student validation
    };
  

    const isStudentValidated = await collection.findOne(studentValidationFilter);
  
    if (!isStudentValidated) {
      // console.log('404')
      return res.status(404).json({ error: 'Student validation failed' });
    }
  
    // Step 3: Update attendance with new data if validation is successful
    const newAttendanceData = {
      "studentAttendances": [
        {
          "studentRollNo": studentRollNo.trim(),
          "studentEmail": studentEmail.trim()
        }
        // Add more student attendance records as needed
      ]
    };
  
    const updateFilter = {
      courseID: courseID.trim(),
      date: date.trim(),
      timeSlot: timeSlot.trim(),
      otp: otp.trim(),
      degree: degree.trim(),
      // department: department.trim(),
      studentSection:studentSection.trim()
    };
  
    const updateResult = await collection.updateOne(
      updateFilter,
      { $addToSet: { "studentAttendances": { $each: newAttendanceData.studentAttendances } } },
      { upsert: false } // Set to false since you only want to update, not insert
    );
  
    if (updateResult) {
      // Document was updated successfully
      res.status(200).json({ message: 'Document updated successfully' });
    } else {
      // No documents matched the update criteria
      // console.log('40')
      res.status(404).json({ error: 'No matching document found for update' });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
  

});



// router.route('/attendance').post(async (req, res) => {
//   try {


//     const database = mongoose.connection.db;
//     const collection = database.collection('attendance');
//     const { courseID, otp, facultyEmail } = req.body;

//     // Validate required fields

//     if (!courseID || !facultyEmail || !otp) {
//       console.log("l", degree)
//       return res.status(400).json({ error: 'some fields are required' });
//     }


//     // Create a document with the extracted fields
//     const attendanceData = {
//       otp: otp,
//       courseID: courseID,
//       facultyEmail: facultyEmail,

//     };
//     console.log("insertion success")
//     const result = await collection.insertOne(attendanceData);

//     if (result) {
//       // Respond with the inserted document's ID
//       res.status(201).json({ insertedId: result.insertedId });
//     } else {
//       // Handle the case where the document was not inserted successfully
//       res.status(500).json({ error: 'Failed to insert document' });
//     }
//   } catch (error) {
//     console.error('Error inserting faculty:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });


module.exports = router;