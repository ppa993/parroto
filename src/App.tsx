import { useCallback, useState } from 'react';
import DeckSelect from './components/DeckSelect';
import Game from './components/Game';
import Stars from './components/Stars';
import { loadSettings, saveSettings, type Settings } from './lib/settings';

type Screen = { name: 'menu' } | { name: 'game'; deckId: string; stage: number; runId: number };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'menu' });
  const [lastDeck, setLastDeck] = useState<string | undefined>(undefined);
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const start = useCallback((deckId: string, stage: number) => {
    setLastDeck(deckId);
    setScreen({ name: 'game', deckId, stage, runId: Date.now() });
  }, []);

  const restart = useCallback(() => {
    setScreen((s) => (s.name === 'game' ? { ...s, runId: Date.now() } : s));
  }, []);

  const menu = useCallback(() => setScreen({ name: 'menu' }), []);

  return (
    <div className="relative h-full w-full overflow-hidden text-white">
      <Stars />
      {screen.name === 'menu' ? (
        <DeckSelect initialDeck={lastDeck} settings={settings} onSettingsChange={updateSettings} onStart={start} />
      ) : (
        <Game
          key={screen.runId}
          deckId={screen.deckId}
          startStage={screen.stage}
          settings={settings}
          onSettingsChange={updateSettings}
          onRestart={restart}
          onMenu={menu}
        />
      )}
    </div>
  );
}
