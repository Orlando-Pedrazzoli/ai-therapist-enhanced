// components/safety/LegalDisclaimer.tsx
'use client';

import React, { useState } from 'react';
import { Shield, AlertCircle, CheckCircle, Info, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface LegalDisclaimerProps {
  onAccept: () => void;
  onDecline: () => void;
}

export const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({
  onAccept,
  onDecline,
}) => {
  const [agreements, setAgreements] = useState({
    notATherapist: false,
    dataPrivacy: false,
    emergencyProtocol: false,
    ageConfirmation: false,
    termsOfUse: false,
  });

  const allAgreed = Object.values(agreements).every(value => value === true);

  const handleCheckboxChange = (key: keyof typeof agreements) => {
    setAgreements(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-white mr-3" />
            <h1 className="text-3xl font-bold text-white">
              Termos de Uso e Segurança
            </h1>
          </div>
          <p className="text-center text-blue-100">
            Por favor, leia com atenção antes de continuar
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Main Disclaimer */}
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
                  Aviso Importante
                </h2>
                <p className="text-red-800 dark:text-red-200">
                  Este é um <strong>assistente de bem-estar baseado em IA</strong>, 
                  NÃO um terapeuta ou profissional de saúde mental licenciado. 
                  Este serviço <strong>NÃO substitui</strong> terapia profissional, 
                  aconselhamento psicológico, tratamento psiquiátrico ou qualquer 
                  outro cuidado de saúde mental profissional.
                </p>
              </div>
            </div>
          </div>

          {/* What This Service IS */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                  O Que Oferecemos
                </h3>
                <ul className="space-y-2 text-green-800 dark:text-green-200">
                  <li>✓ Suporte emocional através de conversas baseadas em IA</li>
                  <li>✓ Técnicas de bem-estar baseadas em evidências (CBT, mindfulness)</li>
                  <li>✓ Exercícios de relaxamento e gerenciamento de estresse</li>
                  <li>✓ Rastreamento de humor e insights sobre padrões emocionais</li>
                  <li>✓ Recursos educacionais sobre saúde mental</li>
                  <li>✓ Disponibilidade 24/7 para suporte não-crítico</li>
                </ul>
              </div>
            </div>
          </div>

          {/* What This Service is NOT */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">
                  O Que NÃO Fazemos
                </h3>
                <ul className="space-y-2 text-orange-800 dark:text-orange-200">
                  <li>✗ Diagnósticos médicos ou psicológicos</li>
                  <li>✗ Prescrição ou recomendação de medicamentos</li>
                  <li>✗ Tratamento de condições graves de saúde mental</li>
                  <li>✗ Intervenção em crises ou emergências médicas</li>
                  <li>✗ Substituição de cuidados profissionais de saúde mental</li>
                  <li>✗ Aconselhamento para decisões médicas</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start">
              <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  Privacidade e Segurança de Dados
                </h3>
                <p className="text-blue-800 dark:text-blue-200 mb-2">
                  Seus dados são tratados com máxima segurança:
                </p>
                <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                  <li>• Criptografia AES-256 para todas as conversas</li>
                  <li>• Dados armazenados de forma segura e anônima</li>
                  <li>• Nunca compartilhamos suas informações com terceiros</li>
                  <li>• Você pode solicitar exclusão dos seus dados a qualquer momento</li>
                  <li>• Conformidade com LGPD (Brasil) e GDPR (Europa)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Emergency Protocol */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <div className="flex items-start">
              <Info className="w-6 h-6 text-purple-600 dark:text-purple-400 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                  Protocolo de Emergência
                </h3>
                <p className="text-purple-800 dark:text-purple-200">
                  Se você estiver em crise ou tendo pensamentos suicidas:
                </p>
                <div className="mt-3 space-y-2">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded">
                    <strong className="text-purple-900 dark:text-purple-300">Brasil:</strong>
                    <span className="ml-2">CVV - 188 (24 horas)</span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded">
                    <strong className="text-purple-900 dark:text-purple-300">EUA:</strong>
                    <span className="ml-2">988 Suicide & Crisis Lifeline</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Consent Checkboxes */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold text-lg mb-4">
              Para continuar, você deve concordar com:
            </h3>

            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={agreements.notATherapist}
                onChange={() => handleCheckboxChange('notATherapist')}
                className="mt-1 mr-3 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Entendo que este é um assistente de IA e <strong>não substitui</strong> ajuda 
                profissional de saúde mental.
              </span>
            </label>

            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={agreements.dataPrivacy}
                onChange={() => handleCheckboxChange('dataPrivacy')}
                className="mt-1 mr-3 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Li e concordo com a <strong>Política de Privacidade</strong> e o tratamento 
                dos meus dados conforme descrito.
              </span>
            </label>

            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={agreements.emergencyProtocol}
                onChange={() => handleCheckboxChange('emergencyProtocol')}
                className="mt-1 mr-3 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Entendo que em caso de <strong>emergência</strong>, devo procurar 
                ajuda profissional imediata.
              </span>
            </label>

            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={agreements.ageConfirmation}
                onChange={() => handleCheckboxChange('ageConfirmation')}
                className="mt-1 mr-3 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Confirmo que tenho <strong>18 anos ou mais</strong>, ou tenho 
                consentimento dos pais/responsáveis.
              </span>
            </label>

            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={agreements.termsOfUse}
                onChange={() => handleCheckboxChange('termsOfUse')}
                className="mt-1 mr-3 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Li e aceito os <strong>Termos de Uso</strong> e as limitações 
                deste serviço.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6">
            <button
              onClick={onDecline}
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onAccept}
              disabled={!allAgreed}
              className={`flex-1 font-semibold py-3 px-6 rounded-lg transition-all ${
                allAgreed
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              {allAgreed ? 'Concordo e Desejo Continuar' : 'Aceite todos os termos'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LegalDisclaimer;
