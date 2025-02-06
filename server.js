const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // for parsing application/json

// ------ WRITE YOUR SOLUTION HERE BELOW ------ //
// An API for managing high scores for different levels in a game. 

const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const extractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');

const MYSECRETJWTKEY = "secret"
const users = [];
const highScores = [];

// Passport JWT Strategy configuration
const optionsForJwtValidation = {
  jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: MYSECRETJWTKEY
};

// Authenticates protected routes
passport.use(new JwtStrategy(optionsForJwtValidation, function(payload, done) {
  const user = users.find((u) => u.userHandle === payload.userHandle);
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
}));

app.use(passport.initialize());

// Players of the game will create an account when they start playing the game. 
// Client signup
app.post('/signup', (req, res) => {
  const { userHandle, password } = req.body;

  if (!userHandle || !password || userHandle.length < 6 || password.length < 6) {
        return res.status(400).json({ message: "Invalid request body" });
  }
  
  // Store users in array (change this?)
  users.push({ userHandle, password });

  res.status(201).json({ message: "User registered successfully"});
})

// Players of the game must login after account creation
// Login with client
app.post('/login', (req, res) => {
  const { userHandle, password } = req.body;

  if (!userHandle || !password || userHandle.length < 6 || password.length < 6) {
    return res.status(400).json({ message: "Bad request" });
  }
  
  if (typeof userHandle !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Bad request" });
  }
  
  const requestBody = req.body;
  if (Object.keys(requestBody).length > 2) {
    return res.status(400).json({ message: "Bad request" });
  } 

  // Check if user exists
  const user = users.find((u) => u.userHandle === userHandle && u.password === password);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized, incorrect username or password" });
  }

  const token = jwt.sign({ userHandle }, MYSECRETJWTKEY, { expiresIn: "1h" });

  res.status(200).json({ jsonWebToken: token });
})

// Submit high score
app.post('/high-scores', passport.authenticate('jwt', { session: false }), function(req, res) {
  const { level, userHandle, score, timestamp } = req.body;

  // all parts of the body are required
  if (!level || !userHandle|| !score || !timestamp) {
    return res.status(400).json({ message: "Invalid request body" });
  } 

  highScores.push({ level, userHandle, score, timestamp });
  res.status(201).json({ message: "High score posted successfully" });
});

// Get high score
app.get('/high-scores', function(req, res) {
  const { level, page } = req.query;

  if (!level) {
    return res.status(400).json({ error: "Level is required" })
  }
  
  // returns an array of scores where the query levels match the highScore levels
  const filteredScores = highScores.filter(score => score.level === level);

  // sorts the scores from largest to smallest
  const sortedScores = filteredScores.sort((a, b) => b.score - a.score);

  // returns an empty array if the there are no high scores for the specified level
  if (filteredScores.length === 0) {
    return res.status(200).json([]);
  }

  const pageNumber = parseInt(page) || 1;
  // decides which score we start from 
  const startIndex = (pageNumber - 1) * 20;
  const endIndex = startIndex + 20;
  const paginatedScores = sortedScores.slice(startIndex, endIndex);

  res.status(200).json(paginatedScores);
});

// new line of text

//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};