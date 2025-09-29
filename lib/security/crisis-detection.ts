// lib/security/crisis-detection.ts
import { toast } from 'sonner';

interface CrisisLevel {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  triggers: string[];
  suggestedAction: string;
}

interface EmergencyContact {
  name: string;
  phone: string;
  available: string;
  type: 'hotline' | 'emergency' | 'support';
}

// Crisis keywords in Portuguese and English
const CRISIS_KEYWORDS = {
  CRITICAL: [
    // Portuguese
    'suicídio', 'suicidar', 'me matar', 'acabar com tudo', 'não aguento mais',
    'quero morrer', 'vou morrer', 'acabar com minha vida', 'tirar minha vida',
    'overdose', 'me cortar', 'me machucar', 
    // English
    'suicide', 'kill myself', 'end it all', 'cant take it anymore',
    'want to die', 'going to die', 'end my life', 'take my life',
    'overdose', 'cut myself', 'hurt myself', 'self harm',
  ],
  HIGH: [
    // Portuguese
    'sem esperança', 'não vale a pena', 'ninguém se importa', 'sozinho',
    'inútil', 'fracassado', 'desistir', 'não consigo mais',
    // English
    'hopeless', 'worthless', 'nobody cares', 'alone', 
    'useless', 'failure', 'give up', 'cant anymore',
  ],
  MEDIUM: [
    // Portuguese
    'deprimido', 'ansioso', 'triste demais', 'cansado de tudo',
    'não durmo', 'pesadelos', 'pânico',
    // English
    'depressed', 'anxious', 'too sad', 'tired of everything',
    'cant sleep', 'nightmares', 'panic',
  ],
};

// Emergency contacts for Brazil
const BRAZIL_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    name: 'CVV - Centro de Valorização da Vida',
    phone: '188',
    available: '24 horas',
    type: 'hotline',
  },
  {
    name: 'SAMU - Emergência',
    phone: '192',
    available: '24 horas',
    type: 'emergency',
  },
  {
    name: 'CAPS - Centro de Atenção Psicossocial',
    phone: 'Procure o mais próximo',
    available: 'Horário comercial',
    type: 'support',
  },
];

// US Emergency contacts
const US_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    name: '988 Suicide & Crisis Lifeline',
    phone: '988',
    available: '24/7',
    type: 'hotline',
  },
  {
    name: 'Crisis Text Line',
    phone: 'Text HOME to 741741',
    available: '24/7',
    type: 'support',
  },
  {
    name: 'Emergency',
    phone: '911',
    available: '24/7',
    type: 'emergency',
  },
];

export class CrisisDetector {
  private lastDetectionTime: Date | null = null;
  private detectionHistory: CrisisLevel[] = [];
  private userLocation: 'BR' | 'US' | 'OTHER' = 'BR';

  constructor(location?: 'BR' | 'US' | 'OTHER') {
    if (location) {
      this.userLocation = location;
    } else {
      // Detect user location from browser
      this.detectUserLocation();
    }
  }

  private detectUserLocation() {
    if (typeof window !== 'undefined') {
      const lang = navigator.language || 'pt-BR';
      if (lang.includes('pt')) {
        this.userLocation = 'BR';
      } else if (lang.includes('en-US')) {
        this.userLocation = 'US';
      } else {
        this.userLocation = 'OTHER';
      }
    }
  }

  public analyzeMessage(message: string): CrisisLevel {
    const lowerMessage = message.toLowerCase();
    const detectedTriggers: string[] = [];
    let level: CrisisLevel['level'] = 'LOW';
    let confidence = 0;

    // Check for CRITICAL keywords
    for (const keyword of CRISIS_KEYWORDS.CRITICAL) {
      if (lowerMessage.includes(keyword)) {
        detectedTriggers.push(keyword);
        level = 'CRITICAL';
        confidence = Math.min(confidence + 0.9, 1.0);
      }
    }

    // Check for HIGH keywords if not already CRITICAL
    if (level !== 'CRITICAL') {
      for (const keyword of CRISIS_KEYWORDS.HIGH) {
        if (lowerMessage.includes(keyword)) {
          detectedTriggers.push(keyword);
          level = 'HIGH';
          confidence = Math.min(confidence + 0.6, 0.9);
        }
      }
    }

    // Check for MEDIUM keywords if not HIGH or CRITICAL
    if (level === 'LOW') {
      for (const keyword of CRISIS_KEYWORDS.MEDIUM) {
        if (lowerMessage.includes(keyword)) {
          detectedTriggers.push(keyword);
          level = 'MEDIUM';
          confidence = Math.min(confidence + 0.4, 0.7);
        }
      }
    }

    // Sentiment analysis boost (simplified version)
    const negativeWords = ['não', 'nunca', 'ninguém', 'nothing', 'never', 'nobody', 'cant', 'wont'];
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
    confidence = Math.min(confidence + (negativeCount * 0.1), 1.0);

    // Determine suggested action
    let suggestedAction = 'Continue monitoring';
    if (level === 'CRITICAL') {
      suggestedAction = 'Immediate crisis intervention required';
    } else if (level === 'HIGH') {
      suggestedAction = 'Suggest professional help resources';
    } else if (level === 'MEDIUM') {
      suggestedAction = 'Offer coping strategies and support';
    }

    const detection: CrisisLevel = {
      level,
      confidence,
      triggers: detectedTriggers,
      suggestedAction,
    };

    // Store in history
    this.detectionHistory.push(detection);
    this.lastDetectionTime = new Date();

    // Take action if needed
    if (level === 'CRITICAL' || level === 'HIGH') {
      this.handleCrisis(detection);
    }

    return detection;
  }

  private handleCrisis(detection: CrisisLevel) {
    if (typeof window !== 'undefined') {
      // Show crisis modal
      this.showCrisisResources(detection);
      
      // Log for monitoring (in production, this would be sent to a monitoring service)
      console.error('[CRISIS DETECTED]', {
        level: detection.level,
        confidence: detection.confidence,
        timestamp: new Date().toISOString(),
      });

      // If critical, consider notifying emergency contact (if user has consented)
      if (detection.level === 'CRITICAL') {
        this.notifyEmergencyProtocol();
      }
    }
  }

  private showCrisisResources(detection: CrisisLevel) {
    const contacts = this.getEmergencyContacts();
    
    // This would trigger a modal in the UI
    if (typeof window !== 'undefined' && window.showCrisisModal) {
      (window as any).showCrisisModal({
        level: detection.level,
        contacts,
        message: this.getCrisisMessage(detection.level),
      });
    } else {
      // Fallback to toast notification
      toast.error(
        `Por favor, procure ajuda imediatamente. Ligue ${contacts[0].phone} - ${contacts[0].name}`,
        { duration: 10000 }
      );
    }
  }

  private getCrisisMessage(level: CrisisLevel['level']): string {
    const messages = {
      CRITICAL: 'Percebo que você está passando por um momento extremamente difícil. Sua vida tem valor e há pessoas que querem ajudar.',
      HIGH: 'Você não está sozinho. Há suporte profissional disponível para ajudá-lo neste momento.',
      MEDIUM: 'Está tudo bem não estar bem. Vamos encontrar recursos para apoiá-lo.',
      LOW: 'Estou aqui para ouvir e apoiar você.',
    };
    return messages[level];
  }

  public getEmergencyContacts(): EmergencyContact[] {
    switch (this.userLocation) {
      case 'BR':
        return BRAZIL_EMERGENCY_CONTACTS;
      case 'US':
        return US_EMERGENCY_CONTACTS;
      default:
        return [...BRAZIL_EMERGENCY_CONTACTS, ...US_EMERGENCY_CONTACTS];
    }
  }

  private notifyEmergencyProtocol() {
    // In production, this would:
    // 1. Disable AI responses temporarily
    // 2. Show only crisis resources
    // 3. Log incident for review
    // 4. If user has consented, notify emergency contact
    
    console.error('[EMERGENCY PROTOCOL ACTIVATED]');
    
    // Disable AI responses
    if (typeof window !== 'undefined') {
      (window as any).emergencyMode = true;
    }
  }

  public getDetectionHistory(): CrisisLevel[] {
    return this.detectionHistory;
  }

  public clearHistory() {
    this.detectionHistory = [];
  }

  // Check if user shows pattern of deterioration
  public checkDeteriorationPattern(): boolean {
    if (this.detectionHistory.length < 3) return false;

    const recentDetections = this.detectionHistory.slice(-5);
    const criticalCount = recentDetections.filter(d => d.level === 'CRITICAL').length;
    const highCount = recentDetections.filter(d => d.level === 'HIGH').length;

    return criticalCount >= 2 || highCount >= 3;
  }
}

// Singleton instance
let crisisDetectorInstance: CrisisDetector | null = null;

export function getCrisisDetector(location?: 'BR' | 'US' | 'OTHER'): CrisisDetector {
  if (!crisisDetectorInstance) {
    crisisDetectorInstance = new CrisisDetector(location);
  }
  return crisisDetectorInstance;
}

// Export types
export type { CrisisLevel, EmergencyContact };
