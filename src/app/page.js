
'use client';
import { useState, useRef } from 'react';

export default function Home() {
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interactiveMode, setInteractiveMode] = useState(false);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  // ✅ STOP ANYTIME - Full interrupt
  const stopEverything = () => {
    if (speechSynthesis.speaking) speechSynthesis.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    setIsSpeaking(false);
    setIsListening(false);
  };

  const closeModal = () => {
    stopEverything();
    setShowModal(false);
    setReply('');
  };

  const callAI = async (message, isInteractive = false) => {
    if (!message) return;
    
    stopEverything();
    
    setLoading(true);
    setReply('');

    if (inputRef.current) inputRef.current.value = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, interactiveMode: isInteractive })
      });

      const data = await response.json();
      const aiReply = data.reply || 'No response';
      setReply(aiReply);

      const utterance = new SpeechSynthesisUtterance(aiReply);
      utterance.rate = isInteractive ? 1.1 : 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        setTimeout(startListening, 500);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setTimeout(startListening, 500);
      };
      speechSynthesis.speak(utterance);
    } catch (error) {
      setReply('Try again!');
      setLoading(false);
      setTimeout(startListening, 1000);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech not supported');
      return;
    }
    
    stopEverything();
    setIsSpeaking(false);

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = interactiveMode;
    recognitionRef.current.interimResults = interactiveMode;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      inputRef.current.value = transcript;
      callAI(transcript, interactiveMode);
      if (!interactiveMode) setIsListening(false);
    };

    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => {
      if (!loading && !isSpeaking) {
        // Don't auto-restart here since callAI handles it after speaking
      }
      setIsListening(false);
    };

    recognitionRef.current.start();
    setIsListening(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col items-center justify-center p-8 text-white">
      <h1 className="text-5xl md:text-7xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-300">
        🎤 Shaik Rezwan Ali 
      </h1>
      <h2 className="text-2xl mb-12 opacity-90">Voice Interview Bot</h2>
      
      <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 md:p-12 max-w-2xl w-full border border-white/20 shadow-2xl">
        <div className="mb-8 p-6 bg-black/20 rounded-2xl text-center">
          <p className="text-xl mb-6">what food item describes you ?</p>
          <button
            onClick={() => {
              setShowModal(true);
              setTimeout(startListening, 100); // ✅ AUTO START LISTENING ON MODAL OPEN
            }}
            className="px-12 py-6 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 rounded-full text-xl font-bold shadow-2xl hover:scale-105 transition-all duration-300"
          >
            🎤 Start Talking
          </button>
        </div>

        <div className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type + Enter..."
            className="w-full p-4 bg-white/10 rounded-2xl border border-white/20 focus:outline-none focus:ring-4 focus:ring-blue-500/30 text-lg"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                callAI(e.target.value.trim(), interactiveMode);
              }
            }}
          />
          
          {loading && (
            <div className="flex items-center space-x-2 text-blue-300 animate-pulse">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
              AI Thinking...
            </div>
          )}
          
          {reply && !showModal && (
            <div className="p-6 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl border border-white/30 relative">
              <p className="text-lg">{reply}</p>
              {isSpeaking && (
                <button
                  onClick={stopEverything}
                  className="absolute top-2 right-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-bold shadow-lg transition-all duration-200 hover:scale-105"
                >
                  ⏹️ Stop Voice
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ✅ MODAL WITH WAVE ANIMATIONS */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 max-w-md w-full border-4 border-white/20 shadow-2xl max-h-[90vh] flex flex-col">
            
            {/* TOGGLE + WARNING */}
            <div className="mb-6 p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-3 text-lg">
                  <input
                    type="checkbox"
                    checked={interactiveMode}
                    onChange={(e) => setInteractiveMode(e.target.checked)}
                    className="w-6 h-6 rounded-lg bg-emerald-500/50 accent-emerald-500 shadow-lg"
                  />
                  <span className="font-bold">⚡ Interactive Mode</span>
                </label>
                <span className="px-3 py-1 bg-emerald-500/30 text-emerald-200 text-xs rounded-full font-bold">
                  {interactiveMode ? 'ON' : 'OFF'}
                </span>
              </div>
              
              {interactiveMode && (
                <div className="flex items-center gap-2 bg-orange-500/20 border border-orange-400/50 rounded-xl p-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  <div>
                    <p className="text-sm font-bold text-orange-200">⚠️ Background Noise Warning</p>
                    <p className="text-xs text-orange-300">Use quiet room for clear speech recognition</p>
                  </div>
                </div>
              )}
              
              <p className={`text-sm mt-2 ${interactiveMode ? 'text-emerald-300' : 'text-gray-400'}`}>
                {interactiveMode ? 'Short answers + interrupt anytime' : 'Detailed full responses → Auto listen again'}
              </p>
            </div>

            {/* Header buttons */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                🎤 Voice Interview
                {interactiveMode && <span className="text-sm ml-2 px-2 py-1 bg-emerald-500/40 rounded-full font-bold">⚡ LIVE</span>}
              </h3>
              <div className="flex gap-2">
                <button onClick={closeModal} className="p-3 bg-red-500/90 hover:bg-red-600 rounded-2xl text-white font-bold shadow-xl hover:scale-105 text-sm px-4">✕ Exit</button>
                <button onClick={stopEverything} className="p-3 bg-orange-500/90 hover:bg-orange-600 rounded-2xl text-white font-bold shadow-xl hover:scale-105 text-sm px-4">⏹️ Stop</button>
              </div>
            </div>

            {/* ✅ WAVE ANIMATIONS - NO READY BUTTON */}
            <div className="flex-1 flex flex-col items-center justify-center mb-8">
              <div className="relative w-48 h-48 md:w-56 md:h-56">
                {/* LISTENING - Red Sound Waves */}
                {isListening && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Wave rings */}
                      <div className="absolute inset-0 w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full bg-red-500/30 animate-ping"></div>
                      <div className="absolute inset-0 w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full bg-red-500/50 animate-ping delay-75"></div>
                      <div className="absolute inset-0 w-20 h-20 md:w-28 md:h-28 mx-auto rounded-full bg-red-600/70 animate-ping delay-150"></div>
                      {/* Core circle */}
                      <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-r from-red-500 to-orange-500 rounded-full shadow-2xl flex items-center justify-center border-4 border-red-400/50 animate-pulse">
                        <div className="w-3 h-3 bg-red-300 rounded-full animate-bounce"></div>
                      </div>
                      <p className="absolute -bottom-12 text-xl font-bold text-red-400 mt-2">🔴 LISTENING</p>
                    </div>
                  </div>
                )}

                {/* SPEAKING - Green/Blue Voice Waves */}
                {isSpeaking && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Wave rings */}
                      <div className="absolute inset-0 w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full bg-emerald-400/30 animate-ping"></div>
                      <div className="absolute inset-0 w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full bg-blue-400/50 animate-ping delay-75"></div>
                      <div className="absolute inset-0 w-20 h-20 md:w-28 md:h-28 mx-auto rounded-full bg-emerald-500/70 animate-ping delay-150"></div>
                      {/* Core circle */}
                      <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full shadow-2xl flex items-center justify-center border-4 border-blue-400/50 animate-pulse">
                        <div className="w-2 h-8 bg-white rounded-full animate-bounce [animation-duration:0.6s]"></div>
                        <div className="w-2 h-6 bg-white/80 rounded-full animate-bounce [animation-delay:-0.2s] ml-1"></div>
                        <div className="w-2 h-4 bg-white/60 rounded-full animate-bounce [animation-delay:-0.4s] ml-1"></div>
                      </div>
                      <p className="absolute -bottom-12 text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mt-2">🟢 SPEAKING</p>
                    </div>
                  </div>
                )}

                {/* PROCESSING - Blue Waves (NO SPINNING) */}
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Processing waves */}
                      <div className="absolute inset-0 w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full bg-blue-400/40 animate-pulse"></div>
                      <div className="absolute inset-0 w-28 h-28 md:w-36 md:h-36 mx-auto rounded-full bg-purple-500/50 animate-pulse delay-100"></div>
                      <div className="absolute inset-0 w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full bg-blue-500/70 animate-pulse delay-200"></div>
                      {/* Core */}
                      <div className="w-28 h-28 md:w-36 md:h-36 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full shadow-2xl flex items-center justify-center border-4 border-purple-400/50 animate-ping">
                        <div className="w-6 h-6 border-2 border-white/50 rounded-full animate-spin"></div>
                      </div>
                      <p className="absolute -bottom-12 text-xl font-bold text-purple-400 mt-2">⚙️ PROCESSING</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center space-y-3 pb-4">
              <p className="text-xl font-bold text-white">
                {loading && '⚙️ Processing your request...'}
                {isListening && (interactiveMode ? '🔴 Continuous listening...' : '🔴 Listening...')}
                {isSpeaking && (interactiveMode ? '🟢 Say next question to interrupt...' : '🟢 Speaking → Auto listen next...')}
                {!isListening && !isSpeaking && !loading && '🎤 Listening started automatically...'}
              </p>
              {reply && (
                <div className="text-sm text-gray-300 max-h-24 overflow-y-auto p-3 bg-black/30 rounded-xl backdrop-blur-sm">
                  "{reply}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <p className="mt-12 text-blue-200 text-sm">100x Interview Bot</p>
    </div>
  );

}
