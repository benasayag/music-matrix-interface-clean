import React, { useState, useEffect, useCallback, useRef } from 'react';

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

  // ... rest of the component code remains the same ...

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

const App: React.FC = MusicalMatrixInterface;

export default App;