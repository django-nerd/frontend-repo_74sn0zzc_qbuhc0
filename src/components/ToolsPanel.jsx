import React, { useEffect, useRef, useState } from 'react';

const KENYAN_GREEN = '#006633';

function loadLocal(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

const TIPS = [
  'Slice leftover ugali, pan-fry with a little oil for crunchy chips.',
  'Cube ugali and stir-fry with sukuma wiki and onions for a quick mboga mix.',
  'Make ugali croutons for soups: oven-toast small cubes.',
  'Grate ugali into crumbs and use as a coating for shallow-fried fish.',
  'Add ugali cubes to scrambled eggs for a filling breakfast.'
];

export default function ToolsPanel() {
  return (
    <section className="w-full p-4">
      <div className="rounded-xl p-4 space-y-4" style={{ background: '#f1f8f4', border: `1px solid ${KENYAN_GREEN}22` }}>
        <h2 className="text-lg font-semibold" style={{ color: KENYAN_GREEN }}>Kitchen Tools</h2>
        <MalaTimer />
        <TipsCarousel />
        <VoiceNotes />
      </div>
    </section>
  );
}

function MalaTimer() {
  const [timers, setTimers] = useState(() => loadLocal('pantry_mala_timers', []));
  useEffect(() => saveLocal('pantry_mala_timers', timers), [timers]);

  const addTimer = (hours) => {
    setTimers((prev) => [{ id: 't' + Date.now(), createdAt: Date.now(), durationMs: hours * 3600 * 1000 }, ...prev]);
  };

  const now = Date.now();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Mala fermentation</div>
          <div className="text-xs text-gray-600">Tap when you start. We mark when it's ready (24h/48h).</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => addTimer(24)} className="px-3 py-1 rounded-md text-white" style={{ background: KENYAN_GREEN }}>I made Mala (24h)</button>
          <button onClick={() => addTimer(48)} className="px-3 py-1 rounded-md border" style={{ borderColor: KENYAN_GREEN, color: KENYAN_GREEN }}>48h</button>
        </div>
      </div>
      <ul className="mt-2 divide-y rounded border">
        {timers.length === 0 && <li className="p-3 text-sm text-gray-500">No timers yet</li>}
        {timers.map((t) => {
          const due = t.createdAt + t.durationMs;
          const remaining = Math.max(0, due - now);
          const hours = Math.floor(remaining / 3600000);
          const mins = Math.floor((remaining % 3600000) / 60000);
          const ready = remaining === 0 || now >= due;
          return (
            <li key={t.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="text-sm">Started {new Date(t.createdAt).toLocaleString()}</div>
                <div className="text-xs text-gray-600">{t.durationMs / 3600000}h timer</div>
              </div>
              <div className={ready ? 'text-emerald-700 font-semibold' : 'text-gray-700'}>
                {ready ? 'Ready! 🎉' : `${hours}h ${mins}m`}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TipsCarousel() {
  const [idx, setIdx] = useState(0);
  const next = () => setIdx((i) => (i + 1) % TIPS.length);
  const prev = () => setIdx((i) => (i - 1 + TIPS.length) % TIPS.length);
  return (
    <div>
      <div className="font-medium">Leftover Ugali tips</div>
      <div className="mt-2 p-3 rounded-md" style={{ background: 'white', border: '1px solid #e5e7eb' }}>
        <div className="text-sm">{TIPS[idx]}</div>
        <div className="mt-2 flex justify-between">
          <button onClick={prev} className="px-3 py-1 rounded border" style={{ borderColor: KENYAN_GREEN, color: KENYAN_GREEN }}>Prev</button>
          <button onClick={next} className="px-3 py-1 rounded text-white" style={{ background: KENYAN_GREEN }}>Next</button>
        </div>
      </div>
    </div>
  );
}

function VoiceNotes() {
  const [notes, setNotes] = useState(() => loadLocal('pantry_voice_notes', []));
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const recorderRef = useRef(null);

  useEffect(() => saveLocal('pantry_voice_notes', notes), [notes]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result;
          setNotes((prev) => [{ id: 'vn' + Date.now(), dataUrl, date: Date.now() }, ...prev]);
        };
        reader.readAsDataURL(blob);
      };
      rec.start();
      setRecording(true);
      // Auto-stop after 2 minutes to limit storage
      setTimeout(() => { if (rec.state === 'recording') stopRecording(); }, 120000);
    } catch (e) {
      alert('Mic permission denied or not supported');
    }
  };

  const stopRecording = () => {
    const rec = recorderRef.current;
    if (rec && rec.state === 'recording') {
      rec.stop();
      setRecording(false);
    }
  };

  const deleteNote = (id) => setNotes((prev) => prev.filter((n) => n.id !== id));

  return (
    <div>
      <div className="font-medium">Voice notes (offline)</div>
      <div className="mt-2 flex items-center gap-2">
        {!recording ? (
          <button onClick={startRecording} className="px-3 py-2 rounded text-white" style={{ background: KENYAN_GREEN }}>Start</button>
        ) : (
          <button onClick={stopRecording} className="px-3 py-2 rounded border" style={{ borderColor: KENYAN_GREEN, color: KENYAN_GREEN }}>Stop</button>
        )}
        <div className="text-xs text-gray-600">Recorded clips stay on this device only.</div>
      </div>
      <ul className="mt-2 divide-y rounded border">
        {notes.length === 0 && <li className="p-3 text-sm text-gray-500">No voice notes yet</li>}
        {notes.map((n) => (
          <li key={n.id} className="p-3 flex items-center justify-between">
            <div className="text-xs text-gray-600">{new Date(n.date).toLocaleString()}</div>
            <div className="flex items-center gap-2">
              <audio controls src={n.dataUrl} className="w-48" />
              <button onClick={() => deleteNote(n.id)} className="text-xs px-2 py-1 rounded border text-red-600 border-red-200">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
