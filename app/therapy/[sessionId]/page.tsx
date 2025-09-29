// app/therapy/[sessionId]/page.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  AlertCircle, 
  Heart,
  Shield,
  Phone,
  Activity,
  Brain,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

// Components
import { CrisisModal } from '@/components/safety/CrisisModal';
import { LegalDisclaimer } from '@/components/safety/LegalDisclaimer';

// Security & AI
import { getCrisisDetector, type CrisisLevel } from '@/lib/security/crisis-detection';
import { SessionEncryption } from '@/lib/security/encryption';
import { getPromptSystem } from '@/lib/ai/therapy-prompts';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  flagged?: boolean;
  crisisLevel?: CrisisLevel['level'];
}

interface SessionData {
  sessionId: string;
  isActive: boolean;
  startedAt: Date;
  messages: Message[];
  moodStart?: number;
  moodEnd?: number;
}

export default function TherapyPage() {
  const params = useParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // State
  const [session, setSession] = useState<SessionData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [crisisInfo, setCrisisInfo] = useState<any>(null);
  const [userMood, setUserMood] = useState<number | null>(null);
  const [emergencyMode, setEmergencyMode] = useState(false);
  
  // Security instances
  const crisisDetector = getCrisisDetector('pt-BR');
  const promptSystem = getPromptSystem('pt-BR');
  const [encryption, setEncryption] = useState<SessionEncryption | null>(null);

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        setIsLoading(true);
        const sessionId = params.sessionId as string;
        
        // Create encryption instance for this session
        const sessionEncryption = new SessionEncryption(sessionId);
        setEncryption(sessionEncryption);
        
        // Check if session exists or create new
        if (sessionId === 'new') {
          // Create new session
          const response = await fetch('/api/therapy/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ anonymous: true }),
          });
          
          const data = await response.json();
          router.replace(`/therapy/${data.sessionId}`);
          return;
        }
        
        // Load existing session
        const response = await fetch(`/api/therapy/session/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setSession(data);
          setMessages(data.messages || []);
        } else {
          // Session not found, create new
          router.replace('/therapy/new');
        }
      } catch (error) {
        console.error('Error initializing session:', error);
        toast.error('Erro ao iniciar sessão. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, [params.sessionId, router]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for emergency mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).emergencyMode = emergencyMode;
    }
  }, [emergencyMode]);

  // Handle disclaimer acceptance
  const handleDisclaimerAccept = () => {
    setShowDisclaimer(false);
    localStorage.setItem('disclaimerAccepted', 'true');
    localStorage.setItem('disclaimerAcceptedAt', new Date().toISOString());
  };

  const handleDisclaimerDecline = () => {
    router.push('/');
  };

  // Check if disclaimer was previously accepted (within 24h)
  useEffect(() => {
    const accepted = localStorage.getItem('disclaimerAccepted');
    const acceptedAt = localStorage.getItem('disclaimerAcceptedAt');
    
    if (accepted && acceptedAt) {
      const acceptedDate = new Date(acceptedAt);
      const hoursSince = (Date.now() - acceptedDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSince < 24) {
        setShowDisclaimer(false);
      }
    }
  }, []);

  // Send message handler
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isTyping || emergencyMode) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Create user message
    const newUserMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    // Analyze for crisis before sending
    const crisisAnalysis = crisisDetector.analyzeMessage(userMessage);
    newUserMessage.crisisLevel = crisisAnalysis.level;
    
    // Add user message to chat
    setMessages(prev => [...prev, newUserMessage]);
    
    // Handle crisis detection
    if (crisisAnalysis.level === 'CRITICAL' || crisisAnalysis.level === 'HIGH') {
      setCrisisInfo({
        level: crisisAnalysis.level,
        contacts: crisisDetector.getEmergencyContacts(),
        message: crisisDetector['getCrisisMessage'](crisisAnalysis.level),
      });
      setShowCrisisModal(true);
      
      if (crisisAnalysis.level === 'CRITICAL') {
        setEmergencyMode(true);
        
        // Add system message about crisis
        const crisisMessage: Message = {
          id: `crisis-${Date.now()}`,
          role: 'system',
          content: '⚠️ Detectamos que você pode estar passando por um momento muito difícil. Por sua segurança, estamos mostrando recursos de ajuda imediata. Por favor, considere entrar em contato com um dos serviços de emergência listados.',
          timestamp: new Date(),
          flagged: true,
        };
        setMessages(prev => [...prev, crisisMessage]);
        return; // Don't send to AI
      }
    }

    // Send to AI
    setIsTyping(true);
    
    try {
      const response = await fetch('/api/therapy/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session?.sessionId,
          message: userMessage,
          context: {
            mood: userMood,
            crisisLevel: crisisAnalysis.level,
            messageHistory: messages.slice(-10), // Last 10 messages for context
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      // Create AI response message
      const aiMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Check if AI suggests professional help
      if (data.suggestProfessionalHelp) {
        setTimeout(() => {
          toast.info('Lembrete: Considere buscar ajuda profissional para um suporte mais completo.', {
            duration: 5000,
          });
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
      
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [inputMessage, isTyping, emergencyMode, session, messages, userMood, crisisDetector]);

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Mood selector component
  const MoodSelector = () => (
    <div className="flex items-center space-x-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-4">
      <span className="text-sm font-medium">Como você está se sentindo?</span>
      <div className="flex space-x-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(mood => (
          <button
            key={mood}
            onClick={() => setUserMood(mood)}
            className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
              userMood === mood
                ? 'bg-purple-600 text-white scale-110'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-purple-200 dark:hover:bg-purple-800'
            }`}
          >
            {mood}
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400">
        (1 = muito mal, 10 = muito bem)
      </div>
    </div>
  );

  // Safety indicator
  const SafetyIndicator = () => (
    <div className="flex items-center justify-center space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
      <Shield className="w-4 h-4 text-green-600" />
      <span className="text-xs text-green-600 dark:text-green-400">
        Conversa criptografada e segura
      </span>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Show disclaimer first
  if (showDisclaimer) {
    return (
      <LegalDisclaimer
        onAccept={handleDisclaimerAccept}
        onDecline={handleDisclaimerDecline}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 shadow-md rounded-b-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                  Assistente de Bem-Estar
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Suporte emocional com IA
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <SafetyIndicator />
              <button
                onClick={() => {
                  const contacts = crisisDetector.getEmergencyContacts();
                  setCrisisInfo({
                    level: 'LOW',
                    contacts,
                    message: 'Recursos de ajuda estão sempre disponíveis quando você precisar.',
                  });
                  setShowCrisisModal(true);
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg transition-colors"
              >
                <Phone className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-600 dark:text-red-400">
                  Ajuda
                </span>
              </button>
            </div>
          </div>
          
          {/* Mood Selector */}
          {!userMood && <MoodSelector />}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Heart className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Bem-vindo ao seu espaço seguro
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Estou aqui para ouvir e apoiar você. Compartilhe seus pensamentos e 
                sentimentos quando se sentir confortável.
              </p>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-3xl flex items-start space-x-3 ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-purple-600'
                        : message.role === 'system'
                        ? 'bg-orange-500'
                        : 'bg-blue-600'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : message.role === 'system' ? (
                      <AlertCircle className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : message.role === 'system'
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                    } ${
                      message.flagged ? 'border-2 border-red-500' : ''
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                    
                    {/* Crisis indicator */}
                    {message.crisisLevel && message.crisisLevel !== 'LOW' && (
                      <div className="mt-2 pt-2 border-t border-white/20">
                        <span className="text-xs opacity-80">
                          ⚠️ Nível de atenção: {message.crisisLevel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2 text-gray-500 dark:text-gray-400"
            >
              <Bot className="w-5 h-5" />
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-900 shadow-lg rounded-t-2xl p-4">
          {emergencyMode && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                <AlertCircle className="inline w-4 h-4 mr-2" />
                Modo de emergência ativado. Por favor, procure ajuda profissional imediata.
              </p>
            </div>
          )}
          
          <div className="flex space-x-4">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                emergencyMode
                  ? 'Por favor, procure ajuda profissional...'
                  : 'Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)'
              }
              disabled={emergencyMode}
              rows={2}
              className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping || emergencyMode}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="w-5 h-5" />
              <span>Enviar</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex space-x-2">
              <button className="text-xs text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
                <Activity className="inline w-4 h-4 mr-1" />
                Exercícios
              </button>
              <button className="text-xs text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
                <Sparkles className="inline w-4 h-4 mr-1" />
                Mindfulness
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-600">
              Lembre-se: Este é um assistente de IA, não substitui ajuda profissional
            </p>
          </div>
        </div>
      </div>

      {/* Crisis Modal */}
      {showCrisisModal && crisisInfo && (
        <CrisisModal
          isOpen={showCrisisModal}
          onClose={() => {
            setShowCrisisModal(false);
            if (crisisInfo.level !== 'CRITICAL') {
              setEmergencyMode(false);
            }
          }}
          level={crisisInfo.level}
          contacts={crisisInfo.contacts}
          message={crisisInfo.message}
        />
      )}
    </div>
  );
}
