// components/safety/CrisisModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { X, Phone, Heart, AlertTriangle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrisisLevel, EmergencyContact } from '@/lib/security/crisis-detection';

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: CrisisLevel['level'];
  contacts: EmergencyContact[];
  message: string;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({
  isOpen,
  onClose,
  level,
  contacts,
  message,
}) => {
  const [userAcknowledged, setUserAcknowledged] = useState(false);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Prevent closing with ESC if crisis level is CRITICAL
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && level !== 'CRITICAL') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, level, onClose]);

  const handleContactClick = (contact: EmergencyContact) => {
    setSelectedContact(contact);
    // Log the interaction for safety monitoring
    console.log('[Crisis Support] User clicked contact:', contact.name);
    
    // If it's a phone number, try to initiate call on mobile
    if (contact.phone && !contact.phone.includes('Text')) {
      window.location.href = `tel:${contact.phone}`;
    }
  };

  const handleAcknowledge = () => {
    setUserAcknowledged(true);
    // Only allow closing if not CRITICAL
    if (level !== 'CRITICAL') {
      setTimeout(() => onClose(), 2000);
    }
  };

  const getLevelColor = () => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500 border-red-600';
      case 'HIGH':
        return 'bg-orange-500 border-orange-600';
      case 'MEDIUM':
        return 'bg-yellow-500 border-yellow-600';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            // Prevent closing by clicking outside if CRITICAL
            if (level !== 'CRITICAL' && e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 ${getLevelColor()}`}
          >
            {/* Header */}
            <div className={`${getLevelColor()} p-6 rounded-t-2xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Heart className="w-8 h-8 text-white animate-pulse" />
                  <h2 className="text-2xl font-bold text-white">
                    Você Não Está Sozinho
                  </h2>
                </div>
                {level !== 'CRITICAL' && (
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors"
                    aria-label="Fechar"
                  >
                    <X className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Message */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Emergency Contacts */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  Ajuda Disponível Agora
                </h3>
                <div className="space-y-3">
                  {contacts.map((contact, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleContactClick(contact)}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-lg">{contact.name}</div>
                          <div className="text-green-100 text-sm">{contact.available}</div>
                        </div>
                        <div className="text-xl font-bold bg-white/20 px-4 py-2 rounded-lg">
                          {contact.phone}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Coping Strategies */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Estratégias Imediatas
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    Respire fundo: Inspire por 4 segundos, segure por 4, expire por 4
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    Entre em contato com alguém de confiança
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    Vá para um lugar seguro e confortável
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    Lembre-se: Este sentimento é temporário
                  </li>
                </ul>
              </div>

              {/* Additional Resources */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <MessageSquare className="inline w-4 h-4 mr-1" />
                  Você também pode enviar uma mensagem de texto ou usar chat online 
                  se preferir não falar ao telefone.
                </p>

                {/* Acknowledge Button */}
                {!userAcknowledged ? (
                  <button
                    onClick={handleAcknowledge}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Entendi, Vou Buscar Ajuda
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-green-600 dark:text-green-400 font-semibold"
                  >
                    ✓ Ótimo! Lembre-se, buscar ajuda é um sinal de força.
                  </motion.div>
                )}
              </div>

              {/* Privacy Notice */}
              <p className="text-xs text-gray-500 dark:text-gray-600 text-center">
                Sua privacidade é importante. Esta conversa é confidencial e estamos
                aqui apenas para apoiar você.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Global function to trigger crisis modal
if (typeof window !== 'undefined') {
  (window as any).showCrisisModal = (props: Omit<CrisisModalProps, 'isOpen' | 'onClose'>) => {
    // This would be handled by a global state manager in production
    console.log('[Crisis Modal] Triggered with props:', props);
  };
}

export default CrisisModal;
