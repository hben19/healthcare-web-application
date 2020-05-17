const pool = require('./pool');
const bcrypt = require('bcrypt');

function User() { };

User.prototype = {

    // Find the user data by gmc number or email.
    find: function (user = null, callback) {
        // If input is number search by GMC number.
        if (user && !isNaN(user)) {          
            var field = 'GMC';
        
        // If input not number search by email address.
        } else {
            var field = 'email';
        }
        
        // SQL QUERY.
        let sql = `SELECT * FROM admins WHERE ${field} = ?`;

        pool.query(sql, user, function (err, result) {
            if (err) throw err

            if (result.length) {
                callback(result[0]);
            } else {
                callback(null);
            }
        });
    },

    login: function (email, password, callback) {
        // Find user by email address.
        this.find(email, function (user) {
            // If user found.
            if (user) {
                // Check the password.
                if (password == user.password) {
                    // Return the user's data
                    callback(user);
                    return;
                }
            }
            // Return null if username or password is incorrect.
            callback(null);
        });
    }
}
module.exports = User;
