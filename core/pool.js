const util = require('util');
const mysql = require('mysql');

// Connection to the database

const pool = mysql.createPool({
    connectionLimit: 30,
    host: 'igor.gold.ac.uk',
    user: 'bholc001',
    password: 'labda10',
    database: 'bholc001_medicode'
});

pool.getConnection((err, connection) => {
    if (err)
        console.error("Something went wrong connection to the database...");
    else {
        console.log("Connected to the database...")
    }
    if (connection)
        connection.release();
    return;
});

//pool.query = util.promisify(pool.query);

module.exports = pool;