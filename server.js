const express = require("express");
const uuid = require("uuid");
const server = express();
server.use(express.json());
server.use(express.static("public"));

// All your code goes here
let activeSessions = {};

async function wordGen() {
    const response = await fetch("https://random-word-api.vercel.app/api?words=1&length=5");
    const results = await response.json();
    return results[0];
}

server.get("/newgame", async (req, res) => {
    const newID = uuid.v4();
    let ans = await wordGen();
    const answer = req.query.answer;
    if (answer) ans = answer;


    activeSessions[newID] = {
        wordToGuess: ans,
        guesses: [],
        wrongLetters: [],
        closeLetters: [],
        rightLetters: [],
        remainingGuesses: 6,
        gameOver: false,
    };


    res.status(201).send({ sessionID: newID });
});


// Do not remove this line. This allows the test suite to start
// multiple instances of your server on different ports
module.exports = server;