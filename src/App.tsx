import React, { useState, useEffect, useCallback, useRef } from 'react';

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const octaves = [3, 4, 5];
const numColumns = 16;

const MatrixCell = ({ isActive, isPlaying, onClick }) => (
  <div
    style={{
      width: '2rem',
      height: '2rem',
      border: '1px solid #D1D5DB',
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: isActive ? '#3B82F6' : 'white',
      boxShadow: isPlaying ? '0 0 0 2px rgba(252, 211, 77, 0.5)' : 'none'
    }}
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
    <div style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Simple Tone Matrix Interface</h1>
      {error && (
        <div style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '1rem', marginBottom: '1rem', borderRadius: '0.25rem' }}>
          {error}
        </div>
      )}
      <div style={{ marginBottom: '1rem' }}>
        <button 
          onClick={handlePlayPause}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ marginRight: '0.5rem' }}>Tempo: {tempo} BPM</span>
        <input
          type="range"
          value={tempo}
          onChange={(e) => setTempo(Number(e.target.value))}
          min={60}
          max={240}
          step={1}
          style={{ width: '16rem' }}
        />
      </div>
      <div style={{ border: '1px solid #D1D5DB' }}>
        {matrix.map((row, rowIndex) => (
          <div key={rowIndex} style={{ display: 'flex' }}>
            <div style={{ width: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', fontWeight: '600' }}>
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