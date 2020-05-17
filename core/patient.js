const pool = require('./pool');

function Patient() { };

Patient.prototype = {

    find: function (patient = null, callback) {

        //searching in the database
        let sql =
            `SELECT * FROM patients 
        JOIN clinicalRecords ON (patients.id=clinicalRecords.patient_id)  
        JOIN address ON (patients.id=address.patient_id) 
        JOIN physicalCondition ON (patients.id=physicalCondition.patient_id) 
        WHERE qrcode = "${patient}"`;

        pool.query(sql, patient, function (err, result) {
            if (err) throw err

            if (result.length) {
                callback(result[0]);
            } else {
                callback(null);
            }
        });
    },

    describe: function (qrcode, callback) {
        // Find user by QR code.
        this.find(qrcode, function (patient) {
            // If user found.
            if (patient) {
                callback(patient);
                return;
            }
            callback(null);
        });
    },

    medicalEvents: function (id, callback) {
        // Find user by ID.
        let sql = `SELECT * FROM medicalEvents
        JOIN admins ON (GMC=doctor_GMC)
        WHERE patient_id = ${id} ORDER BY date DESC`;

        pool.query(sql, id, function (err, result) {
            if (err) throw console.error(err)
            if (result) {
                callback(result);
            } else {
                callback(null);
            }
        })
    },

    addEvent: function (shortDescription, longDescription, patientId, gmc, date, callback) {
        // Insert into medical events
        let sql = `INSERT INTO medicalEvents(patient_id, date, short_description, long_description, doctor_GMC) 
        VALUES (${patientId}, "${date}", "${shortDescription}", "${longDescription}", ${gmc})`

        pool.query(sql, function (err, result) {
            if (err) throw console.error(err)
            if (result) {
                callback(result);
            }
        })
    },

    findEvent: function (eventID, callback) {
        // Find medical event by ID
        let sql = `SELECT * FROM medicalEvents 
        JOIN admins ON (GMC=doctor_GMC) WHERE event_id = ${eventID}`

        pool.query(sql, function (err, result) {
            if (err) throw console.error(err)
            if (result) {
                callback(result[0]);
            }
        })
    },

    editEvent: function (body, callback) {
        // This array contains the values of the fields.
        var bind = [];

        // For loop to push vallues into the array.
        for (prop in body) {
            bind.push(body[prop]);
        }

        let userInput = {
            short_description: bind[0],
            date: bind[1],
            long_description: bind[2],
            event_id: bind[3]
        }

        let sql= `UPDATE medicalEvents 
        SET short_description = "${userInput.short_description}",
        date = "${userInput.date}",
        long_description = "${userInput.long_description}"
        WHERE event_id = ${userInput.event_id}`

        pool.query(sql,function (err, result) {
            if (err) throw console.error(err)
            if(result) {
                callback(result);
            }
        })
    },

    editRecords: function (id, body, callback) {
        // This array contains the values of the fields.
        var bind = [];

        // For loop to push vallues into the array.
        for (prop in body) {
            bind.push(body[prop]);
        }

        // Declare input names
        let userInput = {
            addressLine1: bind[0],
            addressLine2: bind[1],
            country: bind[2],
            city: bind[3],
            postcode: bind[4],
            medicalCondition: bind[5],
            allergies: bind[6],
            prescriptions: bind[7],
            systolic: bind[8],
            diastolic: bind[9],
            heartRate: bind[10],
            height: bind[11],
            weight: bind[12],
        }

        let sqlAddress =
            `UPDATE address
                SET address_line1 = "${userInput.addressLine1}",
                address_line2 = "${userInput.addressLine2}",
                country= "${userInput.country}",
                city="${userInput.city}",
                postcode="${userInput.postcode}"
                WHERE patient_id=${id}
                `
        pool.query(sqlAddress, function (err, result) {
            if (err) throw console.error(err)
        })

        let sqlClinical =
            `UPDATE clinicalRecords
                SET medical_condition = "${userInput.medicalCondition}",
                allergies="${userInput.allergies}",
                prescriptions="${userInput.prescriptions}"
                WHERE patient_id=${id}`

        pool.query(sqlClinical, function (err, result) {
            if (err) throw console.error(err)
        })

        let sqlPhysical =
            `UPDATE physicalCondition
                SET systolic=${userInput.systolic},
                diastolic=${userInput.diastolic},
                last_heart_rate=${userInput.heartRate},
                height=${userInput.height},
                weight=${userInput.weight}
                WHERE patient_id=${id}`

        pool.query(sqlPhysical, function (err, result) {
            if (err) throw console.error(err)
        })

        let updatePatient = 
        `SELECT * FROM patients 
        JOIN clinicalRecords ON (patients.id=clinicalRecords.patient_id)  
        JOIN address ON (patients.id=address.patient_id) 
        JOIN physicalCondition ON (patients.id=physicalCondition.patient_id) 
        WHERE id = "${id}"`;

        pool.query(updatePatient, function (err, result) {
            if (err) throw err

            if (result.length) {
                callback(result[0]);
            } else {
                callback(null);
            }
        });
    }
}

module.exports = Patient;