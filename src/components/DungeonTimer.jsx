import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { useGamification } from './GamificationContext';

const DUNGEON_DURATION = 25 * 60; // 25 minutes in seconds

export default function DungeonTimer({ open, onClose, onBack }) {
  const { dispatch, enabled } = useGamification();
  const [seconds, setSeconds] = useState(DUNGEON_DURATION);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [dungeonCount, setDungeonCount] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!open) {
      // Reset when modal closes
      setRunning(false);
      setSeconds(DUNGEON_DURATION);
      setCompleted(false);
      clearInterval(intervalRef.current);
    }
  }, [open]);

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setCompleted(true);
            setDungeonCount(c => c + 1);
            if (enabled) dispatch('DUNGEON_CLEARED');
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [running, seconds, dispatch, enabled]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = 1 - (seconds / DUNGEON_DURATION);

  const startNew = () => {
    setSeconds(DUNGEON_DURATION);
    setCompleted(false);
    setRunning(true);
  };

  return (
    <Modal open={open} onClose={onClose} onBack={onBack} title="Dungeon Run">
      <div className="flex flex-col items-center py-4">
        {/* Timer ring */}
        <div className="relative w-48 h-48 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={completed ? '#22c55e' : running ? '#6366f1' : '#9ca3af'}
              strokeWidth="6"
              strokeDasharray={`${progress * 283} 283`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {completed ? (
              <>
                <span className="text-4xl mb-1">⚔️</span>
                <span className="text-sm font-bold text-green-600">Dungeon Cleared!</span>
              </>
            ) : (
              <>
                <span className="text-4xl font-mono font-bold text-gray-800">
                  {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  {running ? 'Fokusera...' : 'Redo att börja'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Dungeon count */}
        {dungeonCount > 0 && (
          <div className="flex items-center gap-1.5 mb-4 text-sm text-gray-500">
            <span>🏰</span>
            <span>{dungeonCount} dungeon{dungeonCount > 1 ? 's' : ''} cleared denna session</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          {!running && !completed && (
            <button
              onClick={() => setRunning(true)}
              className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors shadow-md"
            >
              ⚔️ Enter Dungeon
            </button>
          )}
          {running && (
            <button
              onClick={() => { setRunning(false); clearInterval(intervalRef.current); }}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Pausa
            </button>
          )}
          {!running && seconds < DUNGEON_DURATION && !completed && (
            <button
              onClick={() => setRunning(true)}
              className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors shadow-md"
            >
              Fortsätt
            </button>
          )}
          {completed && (
            <button
              onClick={startNew}
              className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors shadow-md"
            >
              🏰 New Dungeon Run
            </button>
          )}
          {(running || (!completed && seconds < DUNGEON_DURATION)) && (
            <button
              onClick={() => { setRunning(false); setSeconds(DUNGEON_DURATION); clearInterval(intervalRef.current); }}
              className="px-4 py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Återställ
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-6 text-center max-w-xs">
          En Dungeon Run är 25 minuter av fokuserat arbete. Slutför den för att få {enabled ? '20 XP!' : 'belöning!'}
        </p>
      </div>
    </Modal>
  );
}
