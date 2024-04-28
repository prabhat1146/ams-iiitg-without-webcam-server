const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');

const multer = require('multer');
const xlsx = require('xlsx');
const { createjwt } = require("../controllers.js/usersControllers");

const secret = process.env.SECRETKEY
// Set up Multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route('/uploadFacultyExcelFile').post(upload.single('file'), async (req, res) => {
  try {

    const database = mongoose.connection.db;
    const collection = database.collection('faculty');
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
      name: row.name,
      email: row.email,
      sex: row.sex,
      department: row.department,
      phone: row.phone
    }));

    await Promise.all(processedData.map(async (item) => {
      await collection.updateOne({ email: item.email }, { $set: item }, { upsert: true });
    }));

    // Log the processed data
    console.log('Processed data:', processedData);

    // You can now perform further operations, such as saving the data to a database

    res.status(200).json({ message: 'Data uploaded successfully.' });
  } catch (error) {
    console.error('Error uploading data from Excel file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.route('/login').get(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('faculty');
    const { email, password, department } = req.query
    try {
      var token = createjwt(email, secret, '2h')

    } catch (error) {
      console.log(error)
    }
    const result = await collection.find({
      email: email,
      password: password,
      department: department
    }).toArray();
    // console.log(result)
    if (result.length > 0) {
      if (result) {
        await collection.updateOne({ email: email }, { $set: { token: token } })
        res.status(200).json(result)
      }
    }

    // console.log(result)


  } catch (error) {
    // console.error('Error deleting faculty:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route('/logout').get(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('faculty');
    const { email } = req.query




    const result = await collection.find({
      email: email,
    }).toArray();

    if (result) {
      collection.updateOne({ email: email }, { $set: { token: null } })
    }
    res.status(200).json(result);

  } catch (error) {
    // console.error('Error deleting faculty:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.route('/find').get(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('faculty');

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

router.route('/search').get(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('faculty');
    const { email } = req.query
    const filter = {
      email: email
    }

    const result = await collection.find(filter).toArray();

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

    const database = mongoose.connection.db;
    const collection = database.collection('faculty');
    const { name, email, phone, department } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !department) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Create a document with the extracted fields
    console.log(req.body)
    const facultynData = {
      name: name,
      email: email,
      phone: phone,
      department: department,
    };

    const findFirst = await collection.find({ email: email }).toArray();
    if (findFirst.length > 0) {
      // console.log("fin",findFirst)
      return
    }
    // console.log("fi",findFirst)
    const result = await collection.insertOne(facultynData);

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

router.route('/add-faculty-courses').post(async (req, res) => {
  try {

    const database = mongoose.connection.db;
    const collection = database.collection('faculty');
    const { courses, email } = req.body;

    // Validate required fields
    if (!courses || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Create a document with the extracted fields
    console.log(req.body)
    // const facultyData = {
    //   facultyCourses:courses
    // };

    const filter = {
      email: email.trim()
    };

    let result = false
    courses.map(async (course) => {
      const update = { $push: { facultyCourses: course } };

      const options = { returnDocument: 'after' };
      const findOld = await collection.find({ 'facultyCourses.courseID': course.courseID }).toArray()

      if (findOld.length == 0) {
        await collection.findOneAndUpdate(filter, update, options);

        if (!result) {
          result = true
          if (result) {
            res.status(200).json({ updateID: "update successful", updatedDocument: result });
          } else {
            res.status(404).json({ updateID: "data not found" });
          }
        }

      }


    })

  } catch (error) {
    console.error('Error inserting faculty:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route('/remove-faculty-courses').post(async (req, res) => {
  try {

    const database = mongoose.connection.db;
    const collection = database.collection('faculty');
    const { courseID, email } = req.body;

    // Validate required fields

    if (!courseID || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }


    const filter = {
      email: email.trim()
    };

    const options = { returnDocument: 'after' };

    // Find the document with the specified email
    const findOld = await collection.findOne({ email: email });

    if (findOld) {
      // Extract the facultyCourses array from the found document
      const oldFacultyCourses = findOld.facultyCourses;

      // Filter out the course with the specified courseID
      const newFacultyCourses = oldFacultyCourses.filter(course => course.courseID !== courseID);

      // Update the document with the new facultyCourses array
      const updateResult = await collection.findOneAndUpdate(
        { email: email },
        { $set: { facultyCourses: newFacultyCourses } }, // Set the facultyCourses field to the new array
        options
      );

      if (updateResult) {
        res.status(200).json({ updateID: "update successful", updatedDocument: updateResult.value });
      } else {
        res.status(500).json({ updateID: "update failed" });
      }
    } else {
      res.status(404).json({ updateID: "data not found" });
    }


  } catch (error) {
    console.error('Error inserting faculty:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route('/remove').post(async (req, res) => {
  try {

    // console.log('hi')
    const database = mongoose.connection.db;
    const collection = database.collection('faculty');
    const { email } = req.body;

    // Validate required fields
    // console.log(email)
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Create a document with the extracted fields
    const facultynData = {
      email: email,
    };
    const result = await collection.findOneAndDelete(facultynData);
    // console.log(result)
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
    const collection = database.collection('faculty');
    const { name, email, phone, department } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Create a document with the extracted fields
    const facultynData = {
      name: name,
      // email: email,
      phone: phone,
      department: department,
    };

    const filter = { email: email };
    const update = { $set: facultynData };
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
