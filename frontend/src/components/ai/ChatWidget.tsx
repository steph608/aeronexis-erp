import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { aiAPI } from '../../services/api';
import chatbotImg from '../../assets/chatbot.jpg';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS_RAPIDES = [
  'Quelles commandes sont en retard ?',
  'Résume les incidents critiques',
  'État du stock critique',
  'Performance globale ce mois',
];

export function ChatWidget() {
  const [open, setOpen]         = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis votre assistant IA AERONEXIS. J\'ai accès à toutes vos données en temps réel : commandes, incidents, stock, expéditions. Comment puis-je vous aider ?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, minimized]);

  const send = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await aiAPI.chat(history);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.data.reply,
        timestamp: new Date(),
      }]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Désolé, une erreur s\'est produite.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: msg,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  if (!open) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setOpen(true)}
          className="relative w-14 h-14 rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-all flex items-center justify-center border-2 border-brand-600"
          title="Assistant IA"
        >
          <img src={chatbotImg} alt="Assistant IA" className="w-full h-full object-cover" />
        </button>
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 transition-all ${minimized ? 'w-72 h-14' : 'w-96 h-[560px]'}`}>

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-brand-600 rounded-t-2xl text-white flex-shrink-0">
        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30 flex-shrink-0">
          <img src={chatbotImg} alt="Assistant IA" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-none">Assistant AERONEXIS</p>
          <p className="text-[10px] text-brand-200 mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" /> En ligne · Llama 3.1
          </p>
        </div>
        <button onClick={() => setMinimized(!minimized)} className="p-1 rounded hover:bg-white/20 transition-colors">
          {minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
        </button>
        <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/20 transition-colors">
          <X size={14} />
        </button>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                  msg.role === 'assistant'
                    ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'assistant'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                      : 'bg-brand-600 text-white rounded-tr-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-400 px-1">{fmt(msg.timestamp)}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
                  <Bot size={14} className="text-brand-700" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm px-3 py-2">
                  <Loader2 size={14} className="animate-spin text-brand-500" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions rapides (seulement au début) */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS_RAPIDES.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-700 hover:bg-brand-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex gap-2 flex-shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Posez votre question..."
              className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-2 outline-none border border-transparent focus:border-brand-400 transition-colors text-slate-800 dark:text-slate-200 placeholder-slate-400"
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send size={13} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
