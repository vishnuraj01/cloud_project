// Import express.js
const express = require("express/index");
const crypto = require("crypto");
const multer = require("multer");
const db = require('./services/db');

// Create express app
var app = express();

// Add static files location
app.use(express.static("public"));

// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');

// Configure multer for file uploads
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

var upload = multer({ storage: storage })

/* GET home page. */
app.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});

// Handle file upload and store hash in the database
app.post('/', upload.single('imageupload'), async function (req, res) {
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const hash = crypto.createHash('sha256');
    const fileData = require('fs').readFileSync(filePath);
    hash.update(fileData);
    const fileHash = hash.digest('hex');

    const sql = 'INSERT INTO images (name, hash) VALUES (?, ?)';
    await db.query(sql, [fileName, fileHash]);

    res.send("File uploaded and hash stored successfully.");
});

// Verify SHA-256 hash
app.get('/verify/:hash', function (req, res) {
    const fileHash = req.params.hash;
    const sql = 'SELECT * FROM images WHERE hash = ?';
    db.query(sql, [fileHash])
        .then(results => {
            console.log(results);
            if (results.length > 0) {
                res.render('view_image', { title: 'View Image', image: results[0] });
            } else {
                res.send('No image found with the provided hash.');
            }
        })
});

// Create a route for testing the db
app.get("/images", function (req, res) {
    // Assumes a table called test_table exists in your database
    sql = 'SELECT * FROM images';
    db.query(sql).then(results => {
        console.log(results);
        res.render('view_all_images', { title: 'All Images', images: results });
    });
});

// Create a route for testing the db
app.get("/db_test", function (req, res) {
    // Assumes a table called test_table exists in your database
    sql = 'select * from test_table';
    db.query(sql).then(results => {
        console.log(results);
        res.send(results)
    });
});

// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function (req, res) {
    res.send("Goodbye world!");
});

// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function (req, res) {
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'name' parameter and use it in a dynamically generated page
    res.send("Hello " + req.params.name);
});

// Start server on port 3000
app.listen(3000, function () {
    console.log(`Server running at http://127.0.0.1:3000/`);
});
