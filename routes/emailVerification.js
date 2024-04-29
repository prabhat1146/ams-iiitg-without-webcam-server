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
        res.status(404).send({ error: "Please use iiitg email address" });
        res.status(204).send({ isEmailVerified: false });
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

router.route('/admin-reset-password').post(async (req, res) => {
    try {


        const database = mongoose.connection.db;
        const collection3 = database.collection('admin');
        const { email, password, name } = req.body;

        if (email.endsWith("@iiitg.ac.in")) {
            // setAlert()
        } else {
            res.status(404).send({ error: "Please use iiitg email address" });
            // setAlert("Please use iiitg email address")
            return
        }

        const secretKey = process.env.SECRETKEY
        // console.log('hi')
        const BASEURL = process.env.CLIENTBASEURL
        // console.log(BASEURL)
        const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
        const verificationToken = createjwt(email, secretKey, expirationTime)
        // console.log(verificationToken)

        try {
            // Use Promise.all to parallelize the queries
            const [admin] = await Promise.all([

                collection3.findOne({ email: email })
            ]);


            const isadmin = !!admin;


            if (isadmin) {
                // Update isVerified to false using update method
                console.log(admin)
                await collection3.updateOne({ email: email }, { $set: { token: verificationToken } });
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
                text: `Hi! ${name} Click the following link to verify and reset your password : ${BASEURL}/admin/verification/reset-password?token=${verificationToken}`
            };

            // Send email
            console.log('email sending to', email)
            console.log('from ', process.env.EMAIL)
            console.log('PASS ', process.env.PASS)
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return res.status(500).send(error.toString());
                }
                console.log('Email sent: ' + info.response);

                // In a real application, you would save the verification token in your database
                // associated with the user's email for later verification.
                console.log(res)
                if (res) {
                    res.status(200).send({ isEmailVerified: true });
                } else {
                    res.status(200).send({ isEmailVerified: false });
                }

            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }

    } catch (error) {
        console.log(error)
    }


});

router.post('/admin-set-password', async (req, res) => {


    try {
        const database = mongoose.connection.db;
        const collection3 = database.collection('admin');
        const { email, password } = req.body
        console.log('e', email, password)
        if (!email || !password) {
            console.log('All fields are required')
            return
        }

        // Use Promise.all to parallelize the queries
        const [admin] = await Promise.all([

            collection3.findOne({ email: email })
        ]);


        const isadmin = !!admin;


        if (isadmin) {

            var resp = await collection3.updateOne({ email: email }, { $set: { password: password } });
        }

        console.log('r', resp, email)


        if (resp?.modifiedCount) {
            res.status(200).json(resp);
        } else {
            res.status(404).json({ error: 'not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/resetpassword', async (req, res) => {


    try {
        const database = mongoose.connection.db;
        const collection1 = database.collection('student');
        const collection2 = database.collection('faculty');
        // const collection3 = database.collection('admin');
        const { email, password } = req.body
        console.log(email, password)
        if (!email || !password) {
            console.log('All fields are required')
            return
        }

        // Use Promise.all to parallelize the queries
        const [studentResult, facultyResult, admin] = await Promise.all([
            collection1.findOne({ studentEmail: email }),
            collection2.findOne({ email: email }),
            // collection3.findOne({ email: email })
        ]);

        const isStudentFound = !!studentResult;
        const isFacultyFound = !!facultyResult;
        // const isadmin = !!admin;

        if (isStudentFound) {
            // Update isVerified to false using update method

            await collection1.updateOne({ studentEmail: email }, { $set: { studentPassword: password } });
        }

        if (isFacultyFound) {
            // Update isVerified to false using update method
            console.log(facultyResult)
            var resp = await collection2.updateOne({ email: email }, { $set: { password: password } });
        }

        if (resp.modifiedCount) {
            res.status(200).json(resp);
        } else {
            res.status(404).json({ error: 'not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



router.get('/verifyEmail', async (req, res) => {
    try {
        var database = mongoose.connection.db;
        var collection1 = database.collection('student');
        var collection2 = database.collection('faculty');
        // var collection3 = database.collection('admin');
        var { token } = req.query;

        console.log(token)
        const secretKey = process.env.SECRETKEY
        console.log(secretKey)
        try {
            var verifiedToken = verifyjwt(token, secretKey)
            // console.log('v')
        } catch (error) {
            return res.json({ isTokenExpire: true })
        }

        try {

            const email = verifiedToken.email
            // Use Promise.all to parallelize the queries
            const [studentResult, facultyResult, admin] = await Promise.all([
                collection1.findOne({ studentEmail: email, token: token }),
                collection2.findOne({ email: email, token: token }),
                // collection3.findOne({ email: email, token: token })
            ]);

            const isStudentFound = !!studentResult;
            const isFacultyFound = !!facultyResult;
            // const isadmin = !!admin

            if (isStudentFound) {
                // Update isVerified to false using update method
                console.log(studentResult)
                var result1 = await collection1.updateOne({ studentEmail: email }, { $set: { isVerified: true } });

            }

            if (isFacultyFound) {
                // Update isVerified to false using update method
                console.log(facultyResult)
                var result2 = await collection2.updateOne({ email: email }, { $set: { isVerified: true } });

            }
            console.log(result)
            if (result) {

            }
            console.log('m', result.modifiedCount)
            if (result) {
                res.status(200).send({ isEmailVerified: true });
            } else {
                res.status(202).send({ isEmailVerified: false });
            }

            // if (isadmin) {
            //     // Update isVerified to false using update method
            //     console.log(facultyResult)
            //     var result = await collection3.updateOne({ email: email }, { $set: { isVerified: true } });
            // }

            // Return the results

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } catch {

    }
});

module.exports = router