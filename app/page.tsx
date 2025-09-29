// app/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Shield, 
  Heart, 
  Lock, 
  Sparkles, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  ArrowRight,
  Star
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const features = [
    {
      icon: Brain,
      title: 'IA Empática',
      description: 'Conversas inteligentes e acolhedoras com tecnologia de ponta',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      icon: Shield,
      title: 'Segurança Total',
      description: 'Criptografia AES-256 e conformidade com LGPD/GDPR',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      icon: Clock,
      title: 'Disponível 24/7',
      description: 'Suporte emocional quando você precisar, a qualquer hora',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      icon: Heart,
      title: 'Técnicas Comprovadas',
      description: 'CBT, DBT, Mindfulness e outras abordagens baseadas em evidências',
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
  ];

  const whatWeOffer = [
    'Suporte emocional através de conversas com IA',
    'Exercícios de respiração e relaxamento',
    'Rastreamento de humor e insights',
    'Técnicas de gerenciamento de estresse',
    'Recursos de mindfulness e meditação',
    'Detecção de crise e recursos de emergência',
  ];

  const whatWeDoNot = [
    'Não fazemos diagnósticos médicos',
    'Não prescrevemos medicamentos',
    'Não substituímos terapia profissional',
    'Não tratamos emergências médicas',
    'Não oferecemos aconselhamento profissional',
    'Não garantimos curas ou resultados específicos',
  ];

  const testimonials = [
    {
      name: 'Ana S.',
      rating: 5,
      text: 'Me ajudou muito nos momentos de ansiedade. As técnicas de respiração são ótimas!',
    },
    {
      name: 'Carlos M.',
      rating: 5,
      text: 'Finalmente um lugar seguro para desabafar sem julgamentos.',
    },
    {
      name: 'Beatriz L.',
      rating: 5,
      text: 'O suporte 24/7 faz toda a diferença quando preciso conversar.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 dark:from-purple-600/20 dark:to-blue-600/20" />
        
        <div className="container mx-auto px-4 py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl">
                <Brain className="w-16 h-16 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Seu Assistente de{' '}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Bem-Estar Mental
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Suporte emocional seguro e confidencial com inteligência artificial.
              Disponível 24 horas por dia, 7 dias por semana.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/therapy/new')}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105"
              >
                Começar Conversa Gratuita
                <ArrowRight className="inline-block ml-2 w-5 h-5" />
              </button>
              
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-lg border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
              >
                Como Funciona
              </button>
            </div>
            
            <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                100% Confidencial
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                LGPD Compliant
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                +10k Usuários
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Alert Banner */}
      <section className="bg-orange-50 dark:bg-orange-900/20 border-y border-orange-200 dark:border-orange-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center text-orange-800 dark:text-orange-200">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <p className="text-sm md:text-base text-center">
              <strong>Importante:</strong> Este é um assistente de bem-estar baseado em IA. 
              Não substitui ajuda profissional. Em caso de emergência, ligue 188 (CVV) ou 192 (SAMU).
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Por que escolher nosso assistente?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Tecnologia avançada com toque humano
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all"
              >
                <div className={`${feature.bgColor} w-14 h-14 rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Offer / What We Don't */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900" id="how-it-works">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Como podemos ajudar
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Transparência sobre nossos serviços
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* What We Offer */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-8"
              >
                <div className="flex items-center mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-green-900 dark:text-green-300">
                    O que oferecemos
                  </h3>
                </div>
                <ul className="space-y-3">
                  {whatWeOffer.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <Sparkles className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              
              {/* What We Don't */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-8"
              >
                <div className="flex items-center mb-6">
                  <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-red-900 dark:text-red-300">
                    O que NÃO fazemos
                  </h3>
                </div>
                <ul className="space-y-3">
                  {whatWeDoNot.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-600 mr-3 mt-0.5">✗</span>
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              O que nossos usuários dizem
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Histórias reais de pessoas reais
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4 italic">
                  "{testimonial.text}"
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {testimonial.name}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Pronto para começar sua jornada de bem-estar?
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              Dê o primeiro passo para uma mente mais saudável hoje
            </p>
            <button
              onClick={() => router.push('/therapy/new')}
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105"
            >
              Iniciar Conversa Gratuita
              <Heart className="inline-block ml-2 w-5 h-5" />
            </button>
            
            <div className="mt-8 text-purple-100">
              <Phone className="inline-block w-5 h-5 mr-2" />
              Em caso de crise: CVV 188 (24h) | SAMU 192
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <p className="mb-4">
              © 2024 AI Wellness Assistant. Todos os direitos reservados.
            </p>
            <p className="text-sm">
              Este serviço não substitui ajuda profissional de saúde mental.
            </p>
            <div className="mt-4 space-x-4">
              <a href="#" className="hover:text-white">Termos de Uso</a>
              <a href="#" className="hover:text-white">Política de Privacidade</a>
              <a href="#" className="hover:text-white">Contato</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
