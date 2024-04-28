const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');

const multer = require('multer');
const xlsx = require('xlsx');


// Set up Multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });


router.route('/uploadCourseExcelFile').post(upload.single('file'), async (req, res) => {
  try {

    const database = mongoose.connection.db;
    const collection = database.collection('course');
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Use xlsx to parse Excel file
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });

    // Assuming the data is in the first sheet (index 0)
    const sheetName = workbook.SheetNames[0];
    const excelData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Process the data based on specific attributes (courseid, coursename, sem, department)
    const processedData = excelData.map(row => ({
      courseID: row.courseID.trim(),
      courseName: row.courseName.trim(),
      semester: row.semester.trim(),
      department: row.department.trim(),
      degree:row.degree.trim()
    }));

    console.log(excelData)

    await Promise.all(processedData.map(async (item) => {
      await collection.updateOne({ courseID: item.courseID }, { $set: item }, { upsert: true });
    }));

    // Log the processed data
    // console.log('Processed data:', processedData);

    // You can now perform further operations, such as saving the data to a database

    res.status(200).json({ message: 'Data uploaded successfully.' });
  } catch (error) {
    console.error('Error uploading data from Excel file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.route('/search').get(async (req, res) => {
  try {
    // console.log("hi")
    const database = mongoose.connection.db;
    const collection = database.collection('course');

    const queryParams = req.query; // Use req.query for GET requests

    // If no parameters were provided, return an empty result
    // console.log(req.query);
    if (Object.keys(queryParams).length === 0) {
      return res.json([]);
    }

    // console.log("h",queryParams);

    const query = {};
    for (const [key, value] of Object.entries(queryParams)) {
      if(value=='' || value=='odd' || value=='even')
      {
        continue
      }
      query[key] = value;
    }

    // console.log("hii",query);

    const result = await collection.find(query).toArray();

    if (result.length > 0) { 
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: "Data not found" });
    }

  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.route('/find').get(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('course');

    const { courseName, courseID, department, semester, degree } = req.body;

    const result = await collection.find({}).toArray();

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


router.route('/add').post(async (req, res) => {
  try {
    // Access the database and collection
    const database = mongoose.connection.db;
    const collection = database.collection('course');

    // Extract fields from the request body
    const { courseName, courseID, department, semester, degree } = req.body;

    // Validate required fields
    if (!courseName || !courseID || !department || !semester) {
      // console.log("course")
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Create a document with the extracted fields
    const courseData = {
      courseName: courseName,
      courseID: courseID,
      department: department,
      degree: degree,
      semester: semester,
    };

    // Insert the document into the collection
    const result = await collection.insertOne(courseData);
    if (result) {
      res.status(201).json({ insertedId: result.insertedId });
    } else {
      res.status(404).json({ message: "Insertion failed" });
    }

    // Respond with the inserted document's ID

  } catch (error) {
    console.error('Error inserting course:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




router.route('/remove').post(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('course');
    const { courseID } = req.body;

    // Validate required fields
    console.log(req.body)
    if (!courseID) {
      return res.status(400).json({ error: 'course-id is required' });
    }

    // Create a document with the extracted fields
    const course = {
      courseID: courseID.trim(),
    };
    const result = await collection.findOneAndDelete(course);

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



router.route('/update').post(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('course');
    const { courseName, courseID, department, semester } = req.body;

    // Validate required fields
    if (!courseID) {
      return res.status(400).json({ error: 'course-id is required' });
    }
    // Create a document with the extracted fields
    const course = {
      courseName: courseName.trim(),
      // email: email,
      department: department.trim(),
      semester: semester.trim()
    };

    const filter = { courseID: courseID.trim() };
    const update = { $set: course };
    const options = { returnDocument: 'after' };

    const result = await collection.findOneAndUpdate(filter, update, options);

    if (result) {
      res.status(200).json({ updateID: "update successfull" });
    } else {
      res.status(404).json({ updateID: "data not found" });
    }
    // Respond with the inserted document's ID

  } catch (error) {
    console.error('Error deleting faculty:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
