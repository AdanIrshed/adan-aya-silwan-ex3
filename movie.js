// js.movie

//Adan Irshed, Aya Ismail, Silwan Omar

// Import the necessary modules
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

// Serve static files (like images)

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname)));


// Connect to SQLite database
    const db = new sqlite3.Database(path.join(__dirname, 'db', 'rtfilms.db'), function(err) {

    if (err) {
        console.error('Error opening database:', err.message);
    } else {
       console.log('Connected to the SQLite database.'); }});


// Set up view engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route to display movie reviews based on query parameter
app.get('/', function(req, res) {
    let movie = req.query.title; // Get movie title from query string

    if (!movie) {
        res.send("Please provide a movie title using the query parameter, e.g., ?title=Inception");
        return;
    }

    // Query the database for the selected movie
    db.get("SELECT * FROM Films WHERE FilmCode = ?", [movie], function(err, row) {
        if (err) {
            console.error("Error retrieving movie:", err.message);
            res.status(500).send("Database error occurred while retrieving the movie.",err.message);
            return;
        }

        // If no movie is found, show a message
        if (!row) {
            res.send(`Movie with title "${movie}" not found.`);
            return;
        }
        row.starring = row.starring || [];
        console.log("Movie found:",row);
       

        // Query reviews for the selected movie
        db.all("SELECT * FROM Reviews WHERE FilmCode = ?", [movie], function(err, reviews) {
            if (err) {
                console.error("Error retrieving reviews:", err.message);
                //res.status(500).send("Database error occurred while retrieving reviews.");
                return;
            }

            console.log(reviews);
            let filmDetails = {};  
            db.all("SELECT Attribute, Value FROM FilmDetails WHERE FilmCode = ?", [movie], function(err, details) {
                if (err) {
                    console.error("Error retrieving film details:", err.message);
                    res.status(500).send("Database error occurred while retrieving film details.");
                    return;
                }
        
                if (details && details.length > 0) {
                    details.forEach(detail => {
                        filmDetails[detail.Attribute] = detail.Value;
                    });
                } else {
                    console.warn(`No details found for FilmCode: ${movie}`);
                }
        
        
            // Render the movie details and reviews using EJS
            res.render('movie', {
                movie: {
                    title: row.Title,
                    score: row.Score ? row.Score + "%" : "N/A", 
                    year: row.Year || "Unknown",
                    FilmCode: row.FilmCode || "Unknown",
                    director: filmDetails["Director"] ? filmDetails["Director"].split(', ') : [],
                    genre: filmDetails["Genre"] ? filmDetails["Genre"].split(', ') : [],
                    runtime: filmDetails["Runtime"] || "Unknown",
                    links: filmDetails["Links"] || "N/A",
                    Rating: filmDetails["Rating"] || "Unknown",
                    TheatricalRelease: filmDetails["Theatrical release"] || "Unknown",
                    ReleaseCompany: filmDetails["Release company"] || "Unknown",
                    MpaaRating : filmDetails["Mpaa rating"] || "Unknown",
                    MovieSynopsis: filmDetails["Movie synopsis"] || "Unknown",
                    BoxOffice: filmDetails["Box office"] || "Unknown",
                    starring: filmDetails["Starring"] ? filmDetails["Starring"].split(', ') : []
                },

             reviews: reviews.map(review => ({
                name: review.ReviewerName,   // Access `review` instead of `reviews`
                affiliation: review.Affiliation,  // Ensure column names match your DB
                text: review.ReviewText   // Ensure column names match your DB
            }))

            });
        });
    });
});
})

// Start the server
app.listen(port, function() {
    console.log(`Server is running at http://localhost:${port}`);
});
