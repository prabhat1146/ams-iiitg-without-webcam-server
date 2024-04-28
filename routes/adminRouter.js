const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');

// Import the connectDB function
const { connectDB } = require('../connection/connectDB');

// Call the connectDB function to establish the connection
connectDB();

setTimeout(async () => {
  try {
    // Access the database and collection
    const database = mongoose.connection.db;
    // alert("admin")
    const collection = database.collection('admin');

    const adminData = {
      adminID: 'admin@iiitg',
      name: 'Admin',
      email: 'admin@iiitg.ac.in',
      phone: '1234567890',
      gender: 'Male',
      password: 'admin'
    }

    const duplicate = await collection.find({ adminID: 'admin@iiitg' }).toArray()
    if (duplicate.length > 0) {
      console.log('Admin already exist !')
      // return res.status(202).json([])
    } else {
      var result = await collection.insertOne(adminData);
      console.log('Admin added success !')
    }

    // Insert a single document


    // res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    console.error('Error inserting admin:', error);
    // res.status(500).json({ error: 'Internal Server Error' });
  }
}, 15000);

// Define the route for finding admin data
router.route('/find').get(async (req, res) => {
  try {
    // Access the database and collection
    const database = mongoose.connection.db;
    const collection = database.collection('admin');

    // Find a document with the specified condition
    // console.log(req.query)
    const result = await collection.find({ adminID: req.query.adminID }).toArray();


    // Send the found document as a response
    // console.log(result,express.query)
    res.status(200).json(result);
  } catch (error) {
    console.error('Error finding admin:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Define the route for finding admin data
router.route('/login').get(async (req, res) => {
  try {
    // Access the database and collection
    const database = mongoose.connection.db;
    const collection = database.collection('admin');

    // Find a document with the specified condition
    console.log(req.query)
    const result = await collection.findOne({ adminID: req.query.adminID, password: req.query.password });

    res.status(200).json(result)
  } catch (error) {
    console.error('Error finding admin:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Define the route for inserting admin data
router.route('/add').post(async (req, res) => {
  try {
    // Access the database and collection
    const database = mongoose.connection.db;
    // alert("admin")
    const collection = database.collection('admin');

    // Extract admin data from the request body
    const adminData = req.body;

    const duplicate = await collection.find({ email: adminData.email }).toArray()
    if (duplicate.length > 0) {
      // console.log('d',adminData)
      // return res.status(202).json([])
    } else {
      var result = await collection.insertOne(adminData);
      // console.log('nd')
    }

    // Insert a single document


    res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    console.error('Error inserting admin:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route('/remove').get(async (req, res) => {
  try {
    // Access the database and collection
    const database = mongoose.connection.db;
    // alert("admin")
    const collection = database.collection('admin');

    // Extract admin data from the request body
    const { email } = req.query;

    const result = collection.deleteOne({ email: email })

    res.status(201).json(result);


    // Insert a single document



  } catch (error) {
    console.error('Error inserting admin:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route('/update').post(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('admin');


    const queryParams = req.body; // Use req.query for GET requests

    const query = {};
    let adminid = ""
    for (const [key, value] of Object.entries(queryParams)) {
      if (value == '' || value == null) {
        continue;
      }
      if (key === 'adminID') {
        adminid = value;
        continue;
      }
      query[key] = value.trim();
    };

    const filter = { adminID: adminid.trim() };
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
router.route('/update-password').post(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('admin');


    const queryParams = req.body; // Use req.query for GET requests
    // console.log(req.query)

    const query = {};
    let adminid = ""
    let oldPassword = '';
    for (const [key, value] of Object.entries(queryParams)) {
      console.log('k',value)
      if (value == '' || value == null) {
        continue;
      }
      if (key === 'adminID') {
        adminid = value;
        continue;
      }
      if (key === 'oldPassword') {
        oldPassword = value;
        continue;
      }
      query[key] = value.trim();
    };
   

    const filter = { adminID: adminid.trim(), password: oldPassword };
    // console.log('f',filter)
    const resu = await collection.find(filter).toArray();
    if (resu.length) {
      // console.log(query)
      const update = { $set: query };
      const options = { returnDocument: 'after' };

      var result = await collection.findOneAndUpdate(filter, update, options);
    }


    if (result) {
      res.status(200).json({ updateID: "update successfull" });
      // console.log(result)
    } else {
      res.status(404).json({ updateID: "data not found" });
    }
    // Respond with the inserted document's ID

  } catch (error) {
    console.error('Error deleting :', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.route('/update-adminid').post(async (req, res) => {
  try {


    const database = mongoose.connection.db;
    const collection = database.collection('admin');


    const queryParams = req.body; // Use req.query for GET requests
    // console.log(req.query)

    const query = {};
    let adminid = ""
    // let oldPassword = '';
    for (const [key, value] of Object.entries(queryParams)) {
      // console.log('k',value)
      if (value == '' || value == null) {
        continue;
      }
      if (key === 'adminID') {
        adminid = value;
        continue;
      }
      
      query[key] = value.trim();
    };
   

    const filter = { adminID: adminid.trim()};
    // console.log('f',filter)
    const resu = await collection.find(filter).toArray();
    if (resu.length) {
      // console.log(query)
      const update = { $set: {adminID:adminid }};
      const options = { returnDocument: 'after' };

      var result = await collection.findOneAndUpdate(filter, update, options);
    }


    if (result) {
      res.status(200).json({ updateID: "update successfull" });
      // console.log(result)
    } else {
      res.status(404).json({ updateID: "data not found" });
    }
    // Respond with the inserted document's ID

  } catch (error) {
    console.error('Error deleting :', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
