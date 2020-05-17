const express = require('express');
const router = express.Router();
const User = require('../core/doctor.js');
const Register = require('../core/register.js');
const Patient = require('../core/patient.js')
const Api = require('../core/android-api')
const async = require('async');
const user = new User();
const register = new Register();
const patient = new Patient();
const api = new Api();
const multer = require('multer');
const path = require('path');


// Setting a redirect function to rederict users when they are not logged in.
const redirectLogin = (req, res, next) => {
    if (!req.session.user) {
        res.redirect('./')
    } else { next(); }
}


// Get index page
router.get('/', (req, res, next) => {
    let user = req.session.user;
    if (user) {
        res.redirect('/usr/344/home');
        return;
    }
    res.render('index', { title: "Login", message: req.flash('error')});
});

// Get home page
router.get('/home', redirectLogin, (req, res, next) => {
    let user = req.session.user;

    // Render home page with the given variables.
    res.render('home', {
        title: 'Home',
        surname: user.surname,
        firstname: user.firstname,
        gmc: user.GMC,
        institution: user.institution,
        specialty: user.specialty,
        location: user.location,
        email: user.email,
        message: req.flash('success')
    });
});

// Post login data
router.post('/login', (req, res, next) => {
    // If there is no input send error message
    if (req.body.email !== "") {
        // if there is imput run the function which is declared in user.js
        user.login(req.sanitize(req.body.email), req.sanitize(req.body.password), function (result) {
            if (result) {
                //if successfull redirect to home page
                req.session.user = result;
                res.redirect('/usr/344/home');
            } else {
                // error handling
                req.flash('error', '- Incorrect email address or password');
                res.render('index', { title: "Login", message: req.flash('error')});
            }
        })
    } else {
        // error handling
        req.flash('error', '- Please enter your credentials');
        res.render('index', { title: "Login", message: req.flash('error')});
    }
});

// Get Register New Patient Page
router.get('/register-patient', redirectLogin, (req, res, next) => {
    res.render('register-patient', { title: "Register Patient" });
    return;
});

// Post registered page.
router.post('/patient-registered', redirectLogin, (req, res, next) => {
    let user = req.session.user;

    // Object for all the user inputs storing them sanitized to avoid sql injection.
    let userInput = {
        firstname: req.sanitize(req.body.firstname),
        surname: req.sanitize(req.body.surname),
        email: req.sanitize(req.body.email),
        addressLine1: req.sanitize(req.body.address_line1),
        addressLine2: req.sanitize(req.body.address_line2),
        country: req.sanitize(req.body.country),
        city: req.sanitize(req.body.city),
        postcode: req.sanitize(req.body.postcode),
        birthDate: req.sanitize(req.body.birth_date),
        medicalCondition: req.sanitize(req.body.medical_condition),
        gender: req.sanitize(req.body.gender),
        allergies: req.sanitize(req.body.allergies),
        prescriptions: req.sanitize(req.body.prescriptions),
        gpGmc: user.GMC,
        bloodType: req.sanitize(req.body.blood_type),
        systolic: req.sanitize(req.body.systolic),
        diastolic: req.sanitize(req.body.diastolic),
        heartRate: req.sanitize(req.body.heart_rate),
        height: req.sanitize(req.body.height),
        weight: req.sanitize(req.body.weight),
        smoker: req.sanitize(req.body.smoker)
    };

    // If email registered send message send error message
    register.find(userInput.email, function (registered) {
        if (registered) {
            // error handling
            req.flash('error', '- This email address is already registered.');
            res.render('register-patient', { title: "Register Patient", message: req.flash('error') });
        } else {
            // Registers the new patient and returns its ID.
            register.create(userInput, userInput.smoker, function (lastId) {
                // If successfull returns the new patient's ID.
                if (lastId) {
                    // Redirects to the registered patient's profile
                    register.find(lastId, function (result) {
                        // Send success message on home page.
                        req.flash('success', '- You have successfully registered your patient. Confirmation email has been sent to the given email address.');
                        res.redirect('/usr/344/home');
                    });
                } else {
                    // Error handling
                    console.log('Error creating a new user ...');
                }
            })
        }
    })
});

// Get password (account set up) page
var token;
var id;

router.get('/password/:token', function (req, res) {
    token = req.params.token;
    // Find Token in Database
    register.findToken(token, function (isValid) {
        // If token found
        if (isValid) {
            register.findByToken(token, function (result) {
                id = result.id;
                res.render('password', { token: token, firstname: result.firstname, surname: result.surname, message: req.flash('error')})
            });
        } else {
            // if token doesn't exist
            res.send("Account set up token is invalid, please contact us by email: medicode.info@gmail.com");
        }
    });
});

// Post set up page.
router.post('/password/completed', function (req, res) {
    // Find token in database
    register.findToken(token, function (isValid) {
        // If tokin is valid
        if (isValid) {
            // Set The Storage Engine and file name for saving in the server
            const storage = multer.diskStorage({
                destination: 'public/img/users/profilePictures/',
                filename: function (req, file, cb) {
                    cb(null, id + ".jpg");
                }
            });

            // Upload file uzing multer
            const upload = multer({
                storage: storage,
                // set file size limit to 5mb
                limits: { fileSize: 5000000 },
                fileFilter: function (req, file, cb) {
                    checkFileType(file, cb);
                }
            }).single("profilePicture");

            // Check File Type
            function checkFileType(file, cb) {
                // Allowed ext
                const filetypes = /jpeg|jpg/;
                // Check ext
                const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
                // Check mime
                const mimetype = filetypes.test(file.mimetype);

                if (mimetype && extname) {
                    return cb(null, true);
                } else {
                    cb('Error: Images Only!');
                }
            }
            // Upload Profile Picture
            upload(req, res, (err) => {
                // If error.
                if (err) {
                    // Send error message
                    req.flash('error','- There was an error with uploading the picture (max 5MB, JPG format). Please try again.')
                    res.redirect(`/usr/344/password/${token}`)

                } else {
                    // If there is no picture
                    if (req.file == undefined) {
                        req.flash('error','- Please upload a picture.')
                        res.redirect(`/usr/344/password/${token}`)

                        // If picture is good and paswords matches
                    } else {
                        // If the two password input matches.
                        if (req.sanitize(req.body.password) === req.sanitize(req.body.confirm)) {
                            register.password(token, req.sanitize(req.body.password), function (result) {
                                // render completed page
                                res.render('password/completed');
                                return;
                            });
                            // if passwords does not match send error message
                        } else {
                            req.flash('error', '- Passwords do not match.');
                            res.redirect(`/usr/344/password/${token}`)
                        }
                    }
                }
            })
        } else {
            // if could not find token
            res.send("Token is invalid, please contact us by email: medicode.info@gmail.com");
        }
    });
});


// Get Scan Page
router.get('/scan', redirectLogin, (req, res, next) => {
    res.render('scan', { title: "QR Scan" });
    return;
})


// Get scan result page
router.get('/scan-result', redirectLogin, (req, res, next) => {

    // find patient by keyword (keyword stored in the qr code)
    patient.describe(req.sanitize(req.query.keyword), function (result) {
        if (result) {
            // create a session for patients
            req.session.patient = result;
            res.redirect('/usr/344/patient');

        } else {
            // send error message if qr code does not exist in our database
            req.flash('error', '- No user find with this QR Code.');
            res.render('scan', {message: req.flash('error')});
        }
    })
})

// Get patient page
router.get('/patient', redirectLogin, (req, res, next) => {
    let patient = req.session.patient;
    if (patient) {
        res.render('patient', {
            title: (patient.firstname + " " + patient.surname),
            id: patient.id,
            surname: patient.surname,
            firstname: patient.firstname,
            email: patient.email,
            date_of_birth: patient.date_of_birth,
            gender: patient.gender,
            medical_condition: patient.medical_condition,
            allergies: patient.allergies,
            prescriptions: patient.prescriptions,
            blood_type: patient.blood_type,
            gpGmc: patient.GP_GMC,
            height: patient.height,
            weight: patient.weight,
            last_heart_rate: patient.last_heart_rate,
            systolic: patient.systolic,
            diastolic: patient.diastolic,
            smoker: patient.smoker,
            address_line_1: patient.address_line1,
            address_line_2: patient.address_line2,
            country: patient.country,
            city: patient.city,
            postcode: patient.postcode
        });
        return;
    } else {
        res.redirect('/usr/344/scan');
    }
});

// Get edit records page
router.get('/edit-records', redirectLogin, (req, res, next) => {
    if (req.session.patient) {
        res.render('edit-records', {
            title: "Edit Records",
            patient: req.session.patient
        })
    }
})

// Post records updated page
router.post('/records-updated', (req, res, next) => {

    // Object for all the user inputs.
    let userInput = {
        addressLine1: req.sanitize(req.body.address_line1),
        addressLine2: req.sanitize(req.body.address_line2),
        country: req.sanitize(req.body.country),
        city: req.sanitize(req.body.city),
        postcode: req.sanitize(req.body.postcode),
        medicalCondition: req.sanitize(req.body.medical_condition),
        allergies: req.sanitize(req.body.allergies),
        prescriptions: req.sanitize(req.body.prescriptions),
        systolic: req.sanitize(req.body.systolic),
        diastolic: req.sanitize(req.body.diastolic),
        heartRate: req.sanitize(req.body.heart_rate),
        height: req.sanitize(req.body.height),
        weight: req.sanitize(req.body.weight),
    };

    // use editRecords function from patient.js
    patient.editRecords(req.session.patient.id, userInput, function (result) {
        if (result) {
            req.session.patient = 0;
            req.session.patient = result;
            res.redirect("/usr/344/patient");
        } else {
            res.send("There was an error.")
        }
    })

})

// Get medical Events page
router.get('/medical-events', redirectLogin, (req, res, next) => {
    if (req.session.patient) {
        // find patient session's medical events
        patient.medicalEvents(req.session.patient.id, function (result) {
            res.render('medical-events', {
                title: "Medical Events",
                medicalEvents: result
            })
        })
    } else {
        res.redirect('/usr/344/scan');
    }
})

// Get add medical event page
router.get('/add-medical-event', redirectLogin, (req, res, next) => {
    // Check if is there a patient session
    if (req.session.patient) {
        res.render('add-medical-event', {
            title: "Add Medical Event"
        })
    } else {
        res.redirect('/usr/344/scan')
    }
})

// Post Medical Event Added Page
router.post('/medical-event-added', redirectLogin, (req, res, next) => {
    if (req.session.patient) {
        // Add medical event
        patient.addEvent(req.sanitize(req.body.shortDescription), req.sanitize(req.body.longDescription),
            req.session.patient.id, req.session.user.GMC, req.sanitize(req.body.date), function (result) {
                if (result) {
                    res.redirect('/usr/344/medical-events')
                } else {
                    res.send("There was an error adding a new event.")
                }
            })
    } else {
        res.redirect('/usr/344/scan')
    }
})

// Get medical event page
router.get('/medical-event', redirectLogin, (req, res, next) => {
    if (req.session.patient) {
        if (req.query.event_id != undefined) {
            patient.findEvent(req.query.event_id, function (result) {
                if (result) {
                    res.render('medical-event', {
                        title: 'Medical Event',
                        event_id: result.event_id,
                        short_description: result.short_description,
                        date: result.date,
                        long_description: result.long_description,
                        gmc: result.doctor_GMC,
                        doctor_firstname: result.firstname,
                        doctor_surname: result.surname,
                        patient: req.session.patient
                    })
                } else {
                    res.send('Event not found')
                }
            })
        } else {
            res.send("Undefined Event")
        }
    }
})

// Get edit medical event page
router.get('/edit-medical-event', redirectLogin, (req, res, next) => {
    if (req.session.patient) {
        if (req.query.event_id != undefined) {
            patient.findEvent(req.query.event_id, function (result) {
                if (result) {
                    res.render('edit-medical-event', {
                        title: 'Medical Event',
                        event_id: result.event_id,
                        short_description: result.short_description,
                        date: result.date,
                        long_description: result.long_description,
                        gmc: result.doctor_GMC
                    })
                } else {
                    res.send('Event not found.')
                }
            })
        } else {
            res.send("Undefined Event.")
        }
    }
})

// Post medical event updated page
router.post('/medical-event-updated', redirectLogin, (req, res, next) => {

    let userInput = {
        short_description: req.sanitize(req.body.shortDescription),
        date: req.sanitize(req.body.date),
        long_description: req.sanitize(req.body.longDescription),
        event_id: req.sanitize(req.body.event_id)
    }

    if (req.session.patient) {
        patient.editEvent(userInput, function (result) {
            if (result) {
                res.redirect(`/usr/344/medical-event?event_id=${userInput.event_id}`)
            } else {
                res.send('There was an error.')
            }
        })
    }
})

// New Scan Destroy Patient Session
router.get('/newscan', (req, res, next) => {
    if (req.session.patient) {
        req.session.patient = 0;
        res.redirect('/usr/344/scan')
    }
});

// Get log out page
router.get('/logout', (req, res, next) => {
    if (req.session.user) {
        req.session.destroy(function () {
            res.redirect('/usr/344/');
        });
    }
});

/////////////////APIS///////////////////////
// Post login data
router.post('/patient-login-api', (req, res, next) => {
        // if there is imput run the function which is declared in user.js
        api.login(req.query.email, req.query.password, function (result) {
            if(result){
                //if successfull redirect to home page
                res.json(result)
            } else {
                res.json(null)
            }
        });
});


// Medical Events Api for android app.
router.get('/medical-events-api', (req, res, next) => {
    if(req.query.patient_id !== undefined && req.query.patient_id !== ''){
        api.medicalEvents_api(req.query.patient_id, function(result){
            if (result.length > 0){
                res.json(result);
            } else {
                res.json('No events');
            }
        })
    } else {
        res.json("No patient ID")
    }
})



module.exports = router;