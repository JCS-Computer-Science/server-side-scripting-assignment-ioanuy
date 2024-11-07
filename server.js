const express = require("express");
const uuid = require("uuid")
const server = express();
server.use(express.json())


//All your code goes here
let activeSessions={}

const words = ['apple', 'phase', 'grape', 'stone', 'music', 'frost'];

server.get('/newgame', (req, res) => {
    const sessionID = uuid.v4();
    const wordToGuess = req.query.answer ||words [Math.floor(Math.random() * words.length)];

    
    activeSessions[sessionID] = {
        wordToGuess,
        guesses: [],
        remainingGuesses: 6,
        wrongLetters: [],
        closeLetters: [],
        rightLetters: [],
        gameOver: false
    };
    res.status(201).json({sessionID});
});



server.get('/gamestate', (req, res) => {
    const {sessionID} = req.query;
    if(!sessionID || !activeSessions[sessionID]){
        return res.status (404).json({error: 'Session not found'});
    }

    const gameState = activeSessions[sessionID];
    res.status(200).json({gameState});
});



server.post('/guess', (req, res) => {
    const {guess, sessionID} = req.body;

    if(!sessionID || !activeSessions[sessionID]) {
        return res.status(404).json({error: 'Session not found'});

    }

    if (!guess || guess.length !== 5 || /[^a-zA-Z]/.test(guess)) {
        return res.status (400).json ({error: 'Invalid guess... Must be exactly 5 letters and contain only letters.'});
    }

    const gameState = activeSession[sessionID];


    if(gameState.guesses.some(g => g.value === guess)){
        return res.status (400).json({error: 'Guess already made'});

    }

    let guessResult = [];
    let wordToGuess = gameState.wordToGuess;

    for (let i=0; i < 5; i++){
        if(guess[i] === wordToGuess [i]){
            guessResult.push({value: guess[i], result: 'Right'});

        }else if (wordToGuess.includes(guess[i])) {
            guessResult.push({value: guess[i], result: 'Close'});
            gameState.closeLetters.push(guess[i]);
        } else {
            guessResult.push({value: guess[i], result: 'Wrong'});
            gameState.wrongLetters.push(guess[i]);
        }
    }

    gameState.guesses.push(guessResult);
    gameState.remainingGuesses--;

    if (guess === wordToGuess){
        gameState.gameOver = true;  
    }

    res.status(201).json({gameState});
}
)





//Do not remove this line. This allows the test suite to start
//multiple instances of your server on different ports
module.exports = server;

