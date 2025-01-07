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

server.get("/gamestate", (req, res) => {
    const sessionID = req.query.sessionID;


    if (!sessionID) {
        res.status(400).send({ error: "Session ID is missing" });
        return;
    }
    if (activeSessions[sessionID]) {
        res.status(200).send({ gameState: activeSessions[sessionID] });
    } else {
        res.status(404).send({ error: "Game doesn't exist" });
    }
});



server.post("/guess", async (req, res) => {
    const sessionID = req.body.sessionID;
    const userGuess = req.body.guess;
    const dictionaryResponse = await fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + userGuess);
    const dictionaryResults = await dictionaryResponse.json();


    if (!userGuess === "phase" && dictionaryResults.title === "No Definitions Found") {
        res.status(400).send({ error: "Not a real word" });
        return;
    }
    if (!sessionID) {
        res.status(400).send({ error: "Session ID is missing" });
        return;
    }
    const session = activeSessions[sessionID];
    if (!session) {
        res.status(404).send({ error: "Session doesn't exist" });
        return;
    }
    if (userGuess.length !== 5) {
        res.status(400).send({ error: "Guess must be 5 letters" });
        return;
    }


    const realValue = session.wordToGuess.split("");
    const guess = [];
    session.remainingGuesses -= 1;


    for (let i = 0; i < userGuess.length; i++) {
        const letter = userGuess[i].toLowerCase();
        let correctness = "WRONG";


        if (!letter.match(/[a-z]/)) {
            res.status(400).send({ error: "must contain letters" });
            return;
        }
        if (letter === realValue[i]) {
            correctness = "RIGHT";
            if (!session.rightLetters.includes(letter)) session.rightLetters.push(letter);
            if (session.closeLetters.includes(letter)) {
                session.closeLetters.splice(session.closeLetters.indexOf(letter), 1);
            }
        } else if (realValue.includes(letter)) {
            correctness = "CLOSE";
            if (!session.closeLetters.includes(letter) && !session.rightLetters.includes(letter)) {
                session.closeLetters.push(letter);
            }
        } else {
            if (!session.wrongLetters.includes(letter)) session.wrongLetters.push(letter);
        }
        guess.push({ value: letter, result: correctness });
    }


    session.guesses.push(guess);
    if (userGuess === session.wordToGuess || session.remainingGuesses <= 0) session.gameOver = true;


    res.status(201).send({ gameState: session });
});


server.delete("/reset", (req, res) => {
    const ID = req.query.sessionID;


    if (!ID) {
        res.status(400).send({ error: "ID is missing" });
        return;
    }
    if (activeSessions[ID]) {
        activeSessions[ID] = {
            wordToGuess: undefined,
            guesses: [],
            wrongLetters: [],
            closeLetters: [],
            rightLetters: [],
            remainingGuesses: 6,
            gameOver: false,
        };
        res.status(200).send({ gameState: activeSessions[ID] });
    } else {
        res.status(404).send({ error: "ID doesn't match any active sessions" });
    }
});



// Do not remove this line. This allows the test suite to start
// multiple instances of your server on different ports
module.exports = server;