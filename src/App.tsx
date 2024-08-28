import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.scss';

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const octaves = [3, 4, 5];
const numColumns = 16;

interface MatrixCellProps {
  isActive: boolean;
  isPlaying: boolean;
  onClick: () => void;
}

const MatrixCell: React.FC<MatrixCellProps> = ({ isActive, isPlaying, onClick }) => (
  <div
    className={`matrix-cell ${isActive ? 'active' : ''} ${isPlaying ? 'playing' : ''}`}
    onClick={onClick}
  />
);

const MusicalMatrixInterface: React.FC = () => {
  const [matrix, setMatrix] = useState<boolean[][]>(
    Array(notes.length * octaves.length)
      .fill(false)
      .map(() => Array(numColumns).fill(false))
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentColumn, setCurrentColumn] = useState<number>(0);
  const [tempo, setTempo] = useState<number>(120);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const toggleCell = (row: number, col: number) => {
    const newMatrix = [...matrix];
    newMatrix[row][col] = !newMatrix[row][col];
    setMatrix(newMatrix);
  };

  const createAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
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

  const getFrequency = (note: string, octave: number) => {
    const baseFrequency = 440; // A4
    const noteIndex = notes.indexOf(note);
    const octaveDiff = octave - 4;
    const halfSteps = noteIndex - notes.indexOf('A') + (12 * octaveDiff);
    return baseFrequency * Math.pow(2, halfSteps / 12);
  };

  const playTone = (frequency: number, time: number) => {
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

  const playColumn = useCallback((column: number) => {
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
    let intervalId: number;
    if (isPlaying) {
      intervalId = window.setInterval(() => {
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
    <div className="musical-matrix">
      <h1>Simple Tone Matrix Interface</h1>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <div className="controls">
        <button onClick={handlePlayPause}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
      <div className="tempo-control">
        <span>Tempo: {tempo} BPM</span>
        <input
          type="range"
          value={tempo}
          onChange={(e) => setTempo(Number(e.target.value))}
          min={60}
          max={240}
          step={1}
        />
      </div>
      <div className="matrix-grid">
        {matrix.map((row, rowIndex) => (
          <div key={rowIndex} className="matrix-row">
            <div className="note-label">
              {notes[rowIndex % notes.length].length === 1 ? ` ${notes[rowIndex % notes.length]}` : notes[rowIndex % notes.length]}
              {octaves[Math.floor(rowIndex / notes.length)]}
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

const App: React.FC = MusicalMatrixInterface;

export default App;