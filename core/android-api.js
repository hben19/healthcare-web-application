const pool = require('./pool');
const bcrypt = require('bcrypt');
const saltRounds = 10;

function Api() { };

Api.prototype = {

    // Find the user data by email
    find: function (email = null, callback) {

        // SQL QUERY.
        let sql = `SELECT * FROM patients 
        JOIN clinicalRecords ON (patients.id=clinicalRecords.patient_id)  
        JOIN address ON (patients.id=address.patient_id) 
        JOIN physicalCondition ON (patients.id=physicalCondition.patient_id) 
        WHERE email = ?`;

        pool.query(sql, email, function (err, result) {
            if (err) throw err

            if (result.length) {
                callback(result[0]);
            } else {
                callback(null);
            }
        });
    },

    login: function (input, plainPassword, callback) {
        // Find user by email address.
        this.find(input, function (patient) {
            // If user found.
            if (patient) {

                hashedPassword = patient.password
                // compare raw password with the one stored in database
                if (bcrypt.compareSync(plainPassword, hashedPassword)) {

                    // Return the user's data
                    callback(patient);
                    return;

                }
            }
            // Return null if username or password is incorrect.
            callback(null);
        });
    },

    // medical events api for android app
    medicalEvents_api: function (id, callback) {
        // Find user by ID.
        let sql = `SELECT * FROM medicalEvents
        WHERE patient_id = ${id}
        ORDER BY date DESC`;

        pool.query(sql, function (err, result) {
            if (err) throw console.error(err)
            if (result) {
                callback(result);
            } else {
                callback(null);
            }
        })
    }
}

module.exports = Api;