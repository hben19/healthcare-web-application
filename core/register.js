const pool = require('./pool');
const Router = require('../routes/pages.js');
var QRCode = require('qrcode');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');


function Register() { };
Register.prototype = {

    // Find if the patient is registered.
    find: function (email = null, callback) {
        let sql = `SELECT * FROM patients WHERE email = ?`;
        pool.query(sql, email, function (err, result) {
            if (err) throw err
            if (result.length) {
                callback(result[0]);
            } else {
                callback(null);
            }
        });
    },

    create: function (body, smoker, callback) {

        // This array contains the values of the fields.
        var bind = [];

        // For loop to push vallues into the array.
        for (prop in body) {
            bind.push(body[prop]);
        }

        // Declare input names
        var userInput = {
            firstname: bind[0],
            surname: bind[1],
            email: bind[2],
            addressLine1: bind[3],
            addressLine2: bind[4],
            country: bind[5],
            city: bind[6],
            postcode: bind[7],
            birthDate: bind[8],
            medicalCondition: bind[9],
            gender: bind[10],
            allergies: bind[11],
            prescriptions: bind[12],
            gpGmc: bind[13],
            bloodType: bind[14],
            systolic: bind[15],
            diastolic: bind[16],
            heartRate: bind[17],
            height: bind[18],
            weight: bind[19],
            smoker: bind[20]
        }

        var smoker = userInput.smoker;

        if (smoker == "Yes" || smoker == "yes") {
            smoker = 1;
        } else {
            smoker = 0;
        }

        // SQL Query
        let sql =
            `INSERT INTO patients(firstname, surname, email) 
        VALUES ("${userInput.firstname}", "${userInput.surname}", "${userInput.email}")`;

        // Call query
        pool.query(sql, bind, function (err, result) {
            if (err) throw err;
            // If no error it returns the insterted ID.
            callback(result.insertId);

            // Push the values into the tables using the same ID.
            let sqlAddress =
                `INSERT INTO address(patient_id, address_line1, address_line2, country, city, postcode) 
            VALUES (${result.insertId}, "${userInput.addressLine1}", "${userInput.addressLine2}", "${userInput.country}", "${userInput.city}", "${userInput.postcode}")`;

            // Call the query string with the values of bind array.
            pool.query(sqlAddress, bind, function (err, result) {
                if (err) throw err;
            });

            let sqlRecord =
                `INSERT INTO clinicalRecords(
                patient_id, date_of_birth, medical_condition, 
                gender, allergies, prescriptions, 
                blood_type, GP_GMC)
            VALUES (
                ${result.insertId}, '${userInput.birthDate}', "${userInput.medicalCondition}", 
                "${userInput.gender}", "${userInput.allergies}", "${userInput.prescriptions}",
                "${userInput.bloodType}", ${userInput.gpGmc})`;

            // Call the query string with the values of bind array.
            pool.query(sqlRecord, bind, function (err, result) {
                if (err) throw err;
            });

            let sqlPhysical =
                `INSERT INTO physicalCondition(
                    patient_id, height, weight, 
                    last_heart_rate, systolic, diastolic, smoker) 
                VALUES (
                ${result.insertId}, ${userInput.height}, ${userInput.weight}, 
                ${userInput.heartRate}, ${userInput.systolic}, ${userInput.diastolic}, ${smoker})`;

            // Call the query string with the values of bind array.
            pool.query(sqlPhysical, bind, function (err, result) {
                if (err) throw err;
            });

            const plainData = `${result.insertId}`;
            // Hash the id before storing it in the qr code:
            bcrypt.hash(plainData, saltRounds, function (err, hashedPassword) {

                // Generating QR Code
                // Calling the node module the result the url base64 string
                QRCode.toDataURL(hashedPassword, function (err, url) {

                    // Taking the base64 out of the string
                    let base64Image = url.split(';base64,').pop();

                    // If no error saves the qr picture on the server.
                    require("fs").writeFile(`public/img/users/qrCodes/${result.insertId}.png`, base64Image, 
                    'base64', function (err) {
                        if (err) {
                            console.log(err)
                        }
                    });

                })

                let insertHashedId =
                    `UPDATE patients SET qrcode = '${hashedPassword}' 
                    WHERE id = ${result.insertId}`;

                pool.query(insertHashedId, bind, function (err, result) {
                    if (err) throw err;
                });
            })

            // Send email to patient to set up a password.

            async.waterfall([
                function (done) {
                    // Creating Random Token Using Crypto
                    crypto.randomBytes(20, function (err, buf) {
                        var token = buf.toString('hex');
                        done(err, token);
                    });
                },
                    // Update token value in the database
                function (token, done) {
                    let insertHashedId =
                        `UPDATE patients SET token = '${token}' 
                        WHERE id = ${result.insertId}`;

                        // Calling SQL Query
                    pool.query(insertHashedId, bind, function (err, result) {
                        if (err) throw err;
                    });

                        // Using Nodemailer to deliver email from the given email address.
                    var smtpTransport = nodemailer.createTransport({
                        service: 'Gmail',
                        auth: {
                            user: 'medicode.info@gmail.com',
                            pass: 'Medicode-2020'
                        }
                    });
                    // Setting email details.
                    var mailOptions = {
                        to: userInput.email,
                        from: 'medicode.info@gmail.com',
                        subject: 'Medicode Account Set Up',
                        text: 'Dear ' + userInput.firstname + ' ' + userInput.surname + ',\n\n' + 'You are now one step closer to have a Medicode account.\n\n' +
                            'You are receiving this because you have requested to set up a Medicode account with your GP.\n\n' +
                            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                            'http://doc.gold.ac.uk/usr/344/password/' + token + '\n\n' +
                            'If you did not request this, please ignore this email.\n'
                    };
                    smtpTransport.sendMail(mailOptions, function (err) {
                        done(err, 'done');
                    });
                }
            ], function (err) {
                if (err) return next(err);
            });
        });
    },

    findToken: function (token, callback) {
        let sql = `SELECT * FROM patients WHERE token = '${token}'`;
        pool.query(sql, token, function (err, result) {
            if (err) throw err
            if (result.length) {
                callback(result[0]);
            } else {
                callback(null);
            }
        });
    },

    password: function (token, password, callback) {
        bcrypt.hash(password, saltRounds, function (err, hashedPassword) {
            let sql = `UPDATE patients SET password = '${hashedPassword}' WHERE token = '${token}'`;
            pool.query(sql, token, function (err, result) {
                if (err) throw err
                callback(result[0]);
            });
        });
    },

    findByToken: function (token, callback) {
        let sql = `SELECT * FROM patients WHERE token = "${token}"`;
        pool.query(sql, token, function (err, result) {
            if (err) throw err
            callback(result[0]);
        });
    }
};

module.exports = Register;