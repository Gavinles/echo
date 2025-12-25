
export type QuestCategory = 'ANCHOR' | 'PoCC' | 'DAO' | 'SIGNAL';

export interface GroundingLink {
  web?: { uri: string; title: string };
  maps?: { uri: string; title: string };
}

export interface Quest {
  id: string;
  title: string;
  prompt: string;
  category: QuestCategory;
  rewardSU: number;
  rewardFEX: number;
  icon: string;
  type: 'text' | 'voice' | 'image' | 'video' | 'vote' | 'search';
}

export interface Manifestation {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  timestamp: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  unlockedAt: number; // level
  category: 'perception' | 'creation' | 'connection';
  icon: string;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  status: 'active' | 'passed' | 'failed';
  impact: string;
}

export interface UserState {
  dcId: string;
  resonance: number;
  fexBalance: number;
  level: number;
  intent: string | null;
  completedQuests: string[];
  manifestations: Manifestation[];
  unlockedSkills: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  grounding?: GroundingLink[];
}
