const { createjwt, verifyjwt } = require("../controllers.js/usersControllers");
const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const dotenv = require('dotenv').config()
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken')
// send verification mail

router.route('/decodeToken').get(async (req, res) => {
    const secretKey = process.env.SECRETKEY;
    const { token } = req.query
    const dtoken = jwt.verify(token, secretKey)
    if (dtoken) {
        res.status(200).json(dtoken)
        return
    }
    res.status(404).json(dtoken)

})
router.route('/SendEmailVerificationLinkForStudent').post(async (req, res) => {
    const database = mongoose.connection.db;
    const collection = database.collection('student');
    const { email, name } = req.body;

    if (!email.endsWith("@iiitg.ac.in")) {
        res.status(404).send({ error: "Please use iiitg email address" });
        console.log('Please use iiitg email address')
        return
    }

    const secretKey = process.env.SECRETKEY

    const BASEURL = process.env.CLIENTBASEURL

    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
    const verificationToken = createjwt(email, secretKey, expirationTime)

    try {
        // Use Promise.all to parallelize the queries
        const isStudentFound = await collection.find({ studentEmail: email }).toArray()

        if (isStudentFound?.length > 0) {
            console.log(isStudentFound)
            const update = await collection.updateOne({ studentEmail: email }, { $set: { token: verificationToken } });
            if (!update.matchedCount > 0) {
                res.status(404).send({ isEmailVerified: false });
                return
            }
        }

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            post: 587,
            // service: 'gmail',
            auth: {
                user: process.env.EMAIL, // replace with your email
                pass: process.env.PASS,
            },
            requireTLS: true,
            secure: false,
        });


        // Create email message
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Email Verification',
            text: `Hi! ${name} Click the following link to verify and reset your password : ${BASEURL}/verification/verify-and-set-password-for-student?token=${verificationToken}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                res.status(500).send({ isEmailVerified: false });
            }
            console.log('Email sent: ' + info.response);

            // In a real application, you would save the verification token in your database
            // associated with the user's email for later verification.

            
            res.status(200).send({ isEmailVerified: true });

        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }


});

router.get('/verifyEmailForStudent', async (req, res) => {
    try {
        var database = mongoose.connection.db;
        var collection = database.collection('student');
        var { token } = req.query;
        const secretKey = process.env.SECRETKEY
        console.log('verifying f-mail')

        try {
            var verifiedToken = verifyjwt(token, secretKey)

        } catch (error) {
            res.json({ isTokenExpire: true })
            return
        }

        try {

            const email = verifiedToken.email

            //    const facultyResult= await collection.find({ email: email, token: token }).toArray();
            const StudentResult = await collection.find({ studentEmail:email }).toArray();
            // const StudentResult = await collection.find().toArray();

            console.log(StudentResult,email)
            if (StudentResult?.length == 1) {
                const result = await collection.updateOne({studentEmail: email }, { $set: { isVerified: true } });
                console.log(result, email)
                if (result.matchedCount > 0) {
                    res.status(200).send({ isEmailVerified: true });
                } else {
                    res.status(202).send({ isEmailVerified: false });
                }
            } else {
                res.status(202).send({ isEmailVerified: false });
            }


        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } catch {

    }
});

router.post('/resetPasswordForStudent', async (req, res) => {


    try {
        const database = mongoose.connection.db;
        const collection = database.collection('student');
        const { email, password } = req.body
        console.log(email, password)
        if (!email || !password) {
            console.log('All fields are required')
            res.status(404).json({ error: 'All fields are required' });
            return
        }

        const isStudentFound = await collection.find({ studentEmail: email }).toArray()

        if (isStudentFound?.length == 1) {

            const result = await collection.updateOne({ studentEmail: email }, { $set: { studentPassword: password } });
            if (result.matchedCount >= 0) {
                res.status(200).json(result);
                return
            }
        }

        res.status(404).json({ error: 'not found' });


    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.route('/SendEmailVerificationLinkForFaculty').post(async (req, res) => {
    const database = mongoose.connection.db;
    const collection = database.collection('faculty');
    const { email, name } = req.body;

    if (!email.endsWith("@iiitg.ac.in")) {
        // res.status(404).send({ error: "Please use iiitg email address" });
        res.status(204).send({ isEmailVerified: false });
        console.log('Please use iiitg email address')
        return
    }

    console.log('sending v-l')

    const secretKey = process.env.SECRETKEY
    const BASEURL = process.env.CLIENTBASEURL

    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
    const verificationToken = createjwt(email, secretKey, expirationTime)


    try {

        const isFacultyFound = await collection.find({ email: email }).toArray()
        console.log(isFacultyFound)

        if (isFacultyFound && isFacultyFound?.length > 0) {
            const result = await collection.updateOne({ email: email }, { $set: { token: verificationToken } });
            console.log(result)
            if (!result.modifiedCount > 0) {
                res.status(204).send({ isEmailVerified: false });
                return;
            }
        }

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            post: 587,
            // service: 'gmail',
            auth: {
                user: process.env.EMAIL, // replace with your email
                pass: process.env.PASS,
            },
            requireTLS: true,
            secure: false,
        });


        // Create email message
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Email Verification',
            text: `Hi! ${name} Click the following link to verify and reset your password : ${BASEURL}/verification/verify-and-set-password-for-faculty?token=${verificationToken}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                res.status(500).send({ isEmailVerified: false });
                return 
            }
            console.log('Email sent: ' + info.response);

            // In a real application, you would save the verification token in your database
            res.status(200).send({ isEmailVerified: true });

        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }


});



router.get('/verifyEmailForFaculty', async (req, res) => {
    try {
        var database = mongoose.connection.db;
        var collection = database.collection('faculty');
        var { token } = req.query;
        const secretKey = process.env.SECRETKEY
        console.log('verifying f-mail')

        try {
            var verifiedToken = verifyjwt(token, secretKey)

        } catch (error) {
            res.json({ isTokenExpire: true })
            return
        }

        try {

            const email = verifiedToken.email

            //    const facultyResult= await collection.find({ email: email, token: token }).toArray();
            const facultyResult = await collection.find({ email: email }).toArray();


            if (facultyResult?.length == 1) {
                const result = await collection.updateOne({ email: email }, { $set: { isVerified: true } });
                console.log(result, email)
                if (result.matchedCount > 0) {
                    res.status(200).send({ isEmailVerified: true });
                } else {
                    res.status(202).send({ isEmailVerified: false });
                }
            } else {
                res.status(202).send({ isEmailVerified: false });
            }


        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } catch {

    }
});


router.post('/resetPasswordForFaculty', async (req, res) => {


    try {
        const database = mongoose.connection.db;
        const collection = database.collection('faculty');
        const { email, password } = req.body
        console.log(email, password)
        if (!email || !password) {
            console.log('All fields are required')
            res.status(404).json({ error: 'All fields are required' });
            return
        }

        const isFacultyFound = await collection.find({ email: email }).toArray()

        if (isFacultyFound?.length == 1) {

            const result = await collection.updateOne({ email: email }, { $set: { password: password } });
            if (result.matchedCount >= 0) {
                res.status(200).json(result);
                return
            }
        }

        res.status(404).json({ error: 'not found' });


    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.route('/SendEmailVerificationLinkForAdmin').post(async (req, res) => {
    const database = mongoose.connection.db;
    const collection = database.collection('admin');
    const { email, name } = req.body;

    if (!email.endsWith("@iiitg.ac.in")) {
        // res.status(404).send({ error: "Please use iiitg email address" });
        console.log('Please use iiitg email address')
        res.status(204).send({ isEmailVerified: false });
        return
    }

    console.log('sending for admin')

    const secretKey = process.env.SECRETKEY
    const BASEURL = process.env.CLIENTBASEURL

    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
    const verificationToken = createjwt(email, secretKey, expirationTime)

    console.log('sending verificatin mail for admin')
    try {

        const isAdminFound = await collection.find({ email: email }).toArray()
        console.log(isAdminFound)

        if (isAdminFound && isAdminFound?.length > 0) {
            const result = await collection.updateOne({ email: email }, { $set: { token: verificationToken } });
            console.log(result)
            if (!result.modifiedCount > 0) {
                res.status(204).send({ isEmailVerified: false });
                return;
            }
        }

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            post: 587,
            // service: 'gmail',
            auth: {
                user: process.env.EMAIL, // replace with your email
                pass: process.env.PASS,
            },
            requireTLS: true,
            secure: false,
        });


        // Create email message
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Email Verification for admin',
            text: `Hi! ${name} Click the following link to verify and reset your password : ${BASEURL}/verification/verify-and-set-password-for-admin?token=${verificationToken}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                res.status(500).send({ isEmailVerified: false });
                return 
            }
            console.log('Email sent: ' + info.response);

            // In a real application, you would save the verification token in your database
            res.status(200).send({ isEmailVerified: true });

        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }


});



router.get('/verifyEmailForAdmin', async (req, res) => {
    try {
        var database = mongoose.connection.db;
        var collection = database.collection('admin');
        var { token } = req.query;
        const secretKey = process.env.SECRETKEY
        console.log('verifying admin-mail')

        try {
            var verifiedToken = verifyjwt(token, secretKey)

        } catch (error) {
            res.json({ isTokenExpire: true })
            return
        }

        try {

            const email = verifiedToken.email

            //    const facultyResult= await collection.find({ email: email, token: token }).toArray();
            const adminResult = await collection.find({email:email}).toArray();

            console.log('ar',adminResult)
            if (adminResult?.length == 1) {
                const result = await collection.updateOne({ email: email }, { $set: { isVerified: true } });
                console.log(result, email)
                if (result.matchedCount > 0) {
                    res.status(200).send({ isEmailVerified: true });
                } else {
                    res.status(202).send({ isEmailVerified: false });
                }
            } else {
                res.status(202).send({ isEmailVerified: false });
            }


        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } catch {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.post('/resetPasswordForAdmin', async (req, res) => {


    try {
        const database = mongoose.connection.db;
        const collection = database.collection('admin');
        const { email, password } = req.body
        console.log(email, password)
        if (!email || !password) {
            console.log('All fields are required')
            res.status(404).json({ error: 'All fields are required' });
            return
        }

        const isAdminFound = await collection.find({ email: email }).toArray()

        if (isAdminFound?.length == 1) {

            const result = await collection.updateOne({ email: email }, { $set: { password: password } });
            if (result.matchedCount >= 0) {
                res.status(200).json(result);
                return
            }
        }

        res.status(404).json({ error: 'not found' });


    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



module.exports = router