import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Trash2, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useAgentData } from '@/hooks/useAgentData';
import { useEnvironment } from '@/contexts/EnvironmentContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const AgentChatView: React.FC = () => {
  const { eoaAddress, smartAccountAddress } = useWallet();
  const { data: agentData } = useAgentData();
  const { environment, targetChain, isMockMode } = useEnvironment();
  const positions = agentData?.positions || [];
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('Zeinyra_chat_history');
    if (saved && !isMockMode) return JSON.parse(saved);
    
    if (isMockMode) {
      return [
        {
          role: 'assistant',
          content: "Hello! I've analyzed your $10,000 portfolio on Base. You current have positions in Uniswap V3, Aerodrome, and Beefy Finance.",
          timestamp: Date.now() - 3600000
        },
        {
          role: 'user',
          content: "Can you find better yields for these positions? I'm looking for a significant boost.",
          timestamp: Date.now() - 3500000
        },
        {
          role: 'assistant',
          content: "Absolutely. I've identified 4 strategic upgrades:\n1. Re-ranging your WETH/USDC Uniswap position (+12% APY)\n2. Migrating AERO/USDC to the new High-Efficiency Gauge (+15% APY)\n3. Rotating Beefy USDC to the Auto-Compounding BIFI vault (+5% APY)\n4. Enabling Flash-Compounder for accrued rewards (+3% APY)\n\nTotal projected boost: +35% APY. Would you like me to prepare the optimization intents?",
          timestamp: Date.now() - 3400000
        },
        {
          role: 'user',
          content: "Yes, that looks great. Let's do it.",
          timestamp: Date.now() - 3300000
        },
        {
          role: 'assistant',
          content: "Excellent. I've highlighted the recommended upgrades in your Strategy Feed. You can review and authorize them individually, or I can batch them through your Smart Wallet.",
          timestamp: Date.now() - 3200000
        }
      ];
    }

    return [
      {
        role: 'assistant',
        content: "Hello! I'm your Zeinyra AI Strategist. I have access to your portfolio data and can help you optimize your yields on Base. How can I assist you today?",
        timestamp: Date.now()
      }
    ];
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('Zeinyra_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize WebSocket
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/chat');
    
    ws.onopen = () => {
      console.log('Agent WebSocket Connected');
      setIsConnected(true);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.response) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          timestamp: Date.now()
        }]);
        setIsLoading(false);
      } else if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "System: " + data.error,
          timestamp: Date.now()
        }]);
        setIsLoading(false);
      }
    };
    
    ws.onclose = () => {
      console.log('Agent WebSocket Disconnected');
      setIsConnected(false);
    };
    
    setSocket(ws);
    
    return () => {
      ws.close();
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !socket || socket.readyState !== WebSocket.OPEN) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    socket.send(JSON.stringify({
      message: input,
      wallet_address: eoaAddress,
      smart_account_address: smartAccountAddress
    }));
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear your chat history?')) {
      setMessages([
        {
          role: 'assistant',
          content: "Chat history cleared. How can I help you optimize your portfolio now?",
          timestamp: Date.now()
        }
      ]);
      localStorage.removeItem('Zeinyra_chat_history');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#00FFA3] flex items-center justify-center shadow-lg shadow-[#00D4FF]/20">
            <Bot size={22} className="text-[#0A0E27]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Zeinyra Strategic Agent
              <span className={`flex h-2 w-2 rounded-full animate-pulse ${isConnected ? 'bg-[#00FFA3]' : 'bg-red-500'}`} />
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
              {isConnected ? 'WSS Real-time Context Active' : 'Offline - Check Agent 2.0'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={clearChat}
          className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
          title="Clear History"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Chat Area */}
      <div 
        className="flex-1 overflow-y-auto pr-2 mb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)'
        }}
      >
        <div className="space-y-6 py-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.timestamp + idx}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${
                    msg.role === 'user' 
                      ? 'bg-white/10' 
                      : 'bg-[#00D4FF]/10 border border-[#00D4FF]/20'
                  }`}>
                    {msg.role === 'user' ? <User size={14} className="text-gray-400" /> : <Bot size={14} className="text-[#00D4FF]" />}
                  </div>
                  
                  <div className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-[#00D4FF] to-[#008BBF] text-white rounded-tr-none'
                      : 'bg-white/[0.03] border border-white/[0.06] text-gray-200 rounded-tl-none backdrop-blur-md'
                  }`}>
                    <div className="prose prose-invert prose-sm max-w-none">
                      {msg.content.split('\n').map((line, i) => (
                        <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                      ))}
                    </div>
                    <span className={`text-[9px] mt-2 block opacity-40 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center">
                  <Loader2 size={14} className="text-[#00D4FF] animate-spin" />
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] px-4 py-3 rounded-2xl rounded-tl-none backdrop-blur-md">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="relative">
        <div 
          className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.06] backdrop-blur-md flex items-center gap-2 pointer-events-none"
        >
          <Sparkles size={10} className="text-[#00FFA3]" />
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Context Active</span>
        </div>

        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything about your portfolio or DeFi strategies..."
            className="w-full bg-white/[0.02] border border-white/[0.1] rounded-2xl px-5 py-4 pr-16 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00D4FF]/50 focus:bg-white/[0.04] transition-all resize-none min-h-[56px] max-h-32"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              input.trim() && !isLoading
                ? 'bg-gradient-to-br from-[#00D4FF] to-[#00FFA3] text-[#0A0E27] shadow-lg shadow-[#00D4FF]/20 cursor-pointer'
                : 'bg-white/5 text-gray-600 cursor-not-allowed'
            }`}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-[10px] text-center text-gray-600 mt-2">
          Hold <kbd className="bg-white/5 px-1 rounded">Shift</kbd> + <kbd className="bg-white/5 px-1 rounded">Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
};

export default AgentChatView;
