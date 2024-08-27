import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Settings } from 'lucide-react';



const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const octaves = [3, 4, 5];
const numColumns = 16;

const MatrixCell = ({ isActive, isPlaying, onClick }) => (
  <div
    className={`w-8 h-8 border border-gray-300 cursor-pointer transition-all duration-200 ${
      isActive ? 'bg-blue-500' : 'bg-white'
    } ${isPlaying ? 'ring-4 ring-yellow-300 ring-opacity-50' : ''}`}
    onClick={onClick}
  />
);

const MusicalMatrixInterface = () => {
  const [matrix, setMatrix] = useState(
    Array(notes.length * octaves.length)
      .fill()
      .map(() => Array(numColumns).fill(false))
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentColumn, setCurrentColumn] = useState(0);
  const [tempo, setTempo] = useState(120);
  const [error, setError] = useState(null);
  const audioContextRef = useRef(null);

  const toggleCell = (row, col) => {
    const newMatrix = [...matrix];
    newMatrix[row][col] = !newMatrix[row][col];
    setMatrix(newMatrix);
  };

  const createAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio context created successfully');
      } catch (err) {
        console.error('Failed to create audio context:', err);
        setError('Failed to create audio context. Please check your browser settings.');
      }
    }
  }, []);

  useEffect(() => {
    createAudioContext();
  }, [createAudioContext]);

  const getFrequency = (note, octave) => {
    const baseFrequency = 440; // A4
    const noteIndex = notes.indexOf(note);
    const octaveDiff = octave - 4;
    const halfSteps = noteIndex - notes.indexOf('A') + (12 * octaveDiff);
    return baseFrequency * Math.pow(2, halfSteps / 12);
  };

  const playTone = (frequency, time) => {
    if (!audioContextRef.current) {
      console.warn('Audio context not ready');
      return;
    }

    const oscillator = audioContextRef.current.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, time);

    const gainNode = audioContextRef.current.createGain();
    gainNode.gain.setValueAtTime(0.5, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.start(time);
    oscillator.stop(time + 0.5);

    console.log(`Playing tone: ${frequency} Hz`);
  };

  const playColumn = useCallback((column) => {
    if (!audioContextRef.current) {
      console.warn('Audio context not ready');
      return;
    }

    const now = audioContextRef.current.currentTime;
    
    matrix.forEach((row, index) => {
      if (row[column]) {
        const octaveIndex = Math.floor(index / notes.length);
        const noteIndex = index % notes.length;
        const note = notes[noteIndex];
        const octave = octaves[octaveIndex];
        const frequency = getFrequency(note, octave);
        playTone(frequency, now);
      }
    });

    console.log(`Played column: ${column}`);
  }, [matrix]);

  useEffect(() => {
    let intervalId;
    if (isPlaying) {
      intervalId = setInterval(() => {
        playColumn(currentColumn);
        setCurrentColumn((prevColumn) => (prevColumn + 1) % numColumns);
      }, (60 / tempo) * 1000);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, currentColumn, tempo, playColumn]);

  const handlePlayPause = () => {
    if (!isPlaying && audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Simple Tone Matrix Interface</h1>
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="mb-4">
        <button onClick={handlePlayPause}>
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
      </div>
      <div className="flex items-center mb-4">
        <Settings size={24} className="mr-2" />
        <span className="mr-2">Tempo: {tempo} BPM</span>
        <input
          type="range"
          value={tempo}
          onChange={(e) => setTempo(Number(e.target.value))}
          min={60}
          max={240}
          step={1}
          className="w-64"
        />
      </div>
      <div className="border border-gray-300">
        {matrix.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            <div className="w-12 flex items-center justify-center bg-gray-100 font-semibold">
              {notes[rowIndex % notes.length]}{octaves[Math.floor(rowIndex / notes.length)]}
            </div>
            {row.map((cell, colIndex) => (
              <MatrixCell
                key={colIndex}
                isActive={cell}
                isPlaying={isPlaying && colIndex === currentColumn}
                onClick={() => toggleCell(rowIndex, colIndex)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const App = MusicalMatrixInterface;
export default App;