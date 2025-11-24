import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/gemini';
import { ChatMessage, GroundingChunk } from '../types';
import ReactMarkdown from 'react-markdown';

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'สวัสดีครับ ผมสามารถช่วยตรวจสอบข้อมูลระดับน้ำ เส้นทางจราจร หรือเบอร์ฉุกเฉินในหาดใหญ่ให้ได้ครับ ถามมาได้เลย',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userText = input.trim();
    setInput('');
    setIsSending(true);

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMsg]);

    try {
      // Prepare history for API
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await sendChatMessage(history, userText);

      const newModelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        timestamp: new Date(),
        sources: response.groundingChunks
      };

      setMessages(prev => [...prev, newModelMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "ขออภัย ระบบขัดข้องชั่วคราว กรุณาลองใหม่",
        timestamp: new Date()
      }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
              }`}
            >
              <div className={`prose max-w-none text-sm ${msg.role === 'user' ? 'prose-invert' : 'prose-slate'}`}>
                 <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold mb-2 opacity-70">Sources:</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((source, idx) => (
                       source.web && (
                        <a 
                          key={idx}
                          href={source.web.uri}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs bg-slate-100 hover:bg-blue-50 text-blue-600 px-2 py-1 rounded border border-slate-200 transition-colors truncate max-w-[200px]"
                        >
                          <i className="fas fa-link mr-1"></i>
                          {source.web.title}
                        </a>
                       )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ถามเกี่ยวกับระดับน้ำ, ถนน, หรือพื้นที่เสี่ยง..."
            className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="absolute right-2 top-1.5 p-1.5 bg-blue-600 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <i className="fas fa-paper-plane text-sm"></i>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};