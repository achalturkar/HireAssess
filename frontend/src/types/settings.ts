export interface CompanySettings {
  profile: {
    name: string;
    domain: string;
    size: string;
    industry: string;
  };
  assessmentDefaults: {
    timeLimitMinutes: number;
    scoringMethod: string;
    passThreshold: number;
    shuffleQuestions: boolean;
    proctoring: boolean;
    flagTabSwitch: boolean;
    autoSubmit: boolean;
  };
  team: {
    name: string;
    email: string;
    role: 'Owner' | 'Admin' | 'Reviewer';
  }[];
  notifications: {
    submissions: boolean;
    flagged: boolean;
    weeklyDigest: boolean;
    productUpdates: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    dateFormat: string;
    weekStart: string;
  };
  security: {
    twoFactor: boolean;
    sso: boolean;
    apiKeyMasked: string;
  };
  billing: {
    plan: string;
    cardLabel: string;
  };
  integrations: {
    name: string;
    description: string;
    connected: boolean;
  }[];
}