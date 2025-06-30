const { useState, useEffect } = React;

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

const getTodayKey = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

function App() {
  const [wordToGuess, setWordToGuess] = useState("");
  const [wordList, setWordList] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [attempts, setAttempts] = useState([]);
  const [status, setStatus] = useState("playing");
  const [history, setHistory] = useState({});

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("wordle-history")) || {};
    setHistory(savedHistory);

    fetch("palabras.json")
      .then(res => res.json())
      .then(words => {
        setWordList(words);
        iniciarPartida(savedHistory, words);
      });
  }, []);

  const iniciarPartida = (savedHistory, words) => {
    const todayKey = getTodayKey();

    if (savedHistory[todayKey]?.games?.length) {
      const lastGame = savedHistory[todayKey].games.at(-1);
      setWordToGuess(lastGame.word);
      setAttempts(lastGame.attempts);
      setStatus(lastGame.status);
    } else {
      const word = words[Math.floor(Math.random() * words.length)];
      setWordToGuess(word);
      setAttempts([]);
      setStatus("playing");
      if (!savedHistory[todayKey]) savedHistory[todayKey] = { games: [] };
      setHistory(savedHistory);
      localStorage.setItem("wordle-history", JSON.stringify(savedHistory));
    }
  };

  const guardarPartida = (newStatus, newAttempts) => {
    const todayKey = getTodayKey();
    const partida = {
      word: wordToGuess,
      attempts: newAttempts,
      status: newStatus,
      date: new Date().toISOString()
    };

    const newHistory = { ...history };
    if (!newHistory[todayKey]) newHistory[todayKey] = { games: [] };
    newHistory[todayKey].games.push(partida);

    setHistory(newHistory);
    localStorage.setItem("wordle-history", JSON.stringify(newHistory));
  };

  const handleGuess = () => {
    if (currentGuess.length !== WORD_LENGTH || status !== "playing") return;

    const newAttempts = [...attempts, currentGuess];
    setAttempts(newAttempts);

    const newStatus = currentGuess === wordToGuess
      ? "won"
      : newAttempts.length === MAX_ATTEMPTS
      ? "lost"
      : "playing";

    setStatus(newStatus);
    setCurrentGuess("");

    if (newStatus !== "playing") {
      guardarPartida(newStatus, newAttempts);
    }
  };

  const resetGame = () => {
    const newWord = wordList[Math.floor(Math.random() * wordList.length)];
    setWordToGuess(newWord);
    setAttempts([]);
    setStatus("playing");
    setCurrentGuess("");
  };

  return (
    <div className="container">
      <h1>Wordle</h1>
      <div className="grid">
        {[...Array(MAX_ATTEMPTS)].map((_, rowIndex) => (
          <div className="row" key={rowIndex}>
            {[...Array(WORD_LENGTH)].map((_, colIndex) => {
              const letter = attempts[rowIndex]?.[colIndex] || "";
              const correct = wordToGuess[colIndex] === letter;
              const exists = !correct && wordToGuess.includes(letter);
              let className = letter ? (correct ? "correct" : exists ? "present" : "absent") : "";
              return (
                <div key={colIndex} className={`cell ${className}`}>
                  {letter.toUpperCase()}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {status === "playing" && (
        <div className="input-area">
          <input
            maxLength={WORD_LENGTH}
            value={currentGuess}
            onChange={(e) => setCurrentGuess(e.target.value.toLowerCase())}
          />
          <button onClick={handleGuess}>Adivinar</button>
        </div>
      )}

      {status !== "playing" && (
        <>
          <div className="result">
            {status === "won" ? (
              <p>¡Correcto! Palabra: <strong>{wordToGuess.toUpperCase()}</strong></p>
            ) : (
              <p>Perdiste. La palabra era: <strong>{wordToGuess.toUpperCase()}</strong></p>
            )}
          </div>
          <button onClick={resetGame}>Volver a jugar</button>
        </>
      )}

      <div className="history">
        <h2>Historial</h2>
        {Object.entries(history).length === 0 && <p>No hay partidas jugadas.</p>}
        <ul>
          {Object.entries(history).map(([date, dayData]) => (
            <li key={date}>
              <strong>{date}</strong> — {dayData.games.length} partida{dayData.games.length > 1 ? "s" : ""}
              <ul>
                {dayData.games.map((game, i) => (
                  <li key={i}>
                    Intentos: {game.attempts.length} — Resultado: {game.status === "won" ? "Ganado" : "Perdido"}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
