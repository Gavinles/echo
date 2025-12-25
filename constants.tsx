
import { Quest, Skill, Proposal } from './types';

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'morning-sync',
    title: 'Morning Intent',
    prompt: 'Declare your core objective for this cycle.',
    category: 'ANCHOR',
    rewardSU: 1,
    rewardFEX: 5,
    icon: '☀️',
    type: 'text'
  },
  {
    id: 'signal-search',
    title: 'Signal Search',
    prompt: 'Find real-world proof of a positive solarpunk breakthrough today.',
    category: 'SIGNAL',
    rewardSU: 3,
    rewardFEX: 25,
    icon: '📡',
    type: 'search'
  },
  {
    id: 'vision-manifest',
    title: 'Vision Manifest',
    prompt: 'Describe a virtue. We will manifest its visual form.',
    category: 'PoCC',
    rewardSU: 5,
    rewardFEX: 100,
    icon: '💎',
    type: 'image'
  },
  {
    id: 'evening-echo',
    title: 'Evening Reflection',
    prompt: 'What was your most coherent moment today?',
    category: 'ANCHOR',
    rewardSU: 1,
    rewardFEX: 10,
    icon: '🌙',
    type: 'text'
  },
  {
    id: 'dao-vote-1',
    title: 'DAO Calibration',
    prompt: 'Proposal #42: Prioritize regenerative farming in the Eastern Sector.',
    category: 'DAO',
    rewardSU: 2,
    rewardFEX: 5,
    icon: '⚖️',
    type: 'vote'
  }
];

export const SKILLS: Skill[] = [
  { id: 'lucidity', name: 'Neural Lucidity', description: 'Improved clarity in AI feedback and reasoning.', unlockedAt: 0, category: 'perception', icon: '🧠' },
  { id: 'creation', name: 'Etheric Drafting', description: 'Ability to generate complex visual manifestations.', unlockedAt: 2, category: 'creation', icon: '🎨' },
  { id: 'telepathy', name: 'Sympathetic Resonance', description: 'Unlock Live Resonance sessions with the Echo.', unlockedAt: 1, category: 'connection', icon: '📡' },
  { id: 'leadership', name: 'Kairos Sovereignty', description: 'Double voting weight in Gaia DAO proposals.', unlockedAt: 5, category: 'connection', icon: '👑' },
  { id: 'foresight', name: 'Pattern Recognition', description: 'AI detects signals with 50% more accuracy.', unlockedAt: 3, category: 'perception', icon: '👁️' },
];

export const PROPOSALS: Proposal[] = [
  { id: 'p1', title: 'Gaia Restoration', description: 'Allocate 50,000 $FEX to coral reef regeneration via autonomous bio-bots.', votesFor: 1240, votesAgainst: 120, status: 'active', impact: 'Environmental' },
  { id: 'p2', title: 'Open Neural Network', description: 'Subsidize personal Eidolon compute for low-resonance sectors.', votesFor: 890, votesAgainst: 450, status: 'active', impact: 'Social' },
  { id: 'p3', title: 'Solar Canopy Expansion', description: 'Install translucent solar tiles over the Central Commons.', votesFor: 2100, votesAgainst: 50, status: 'passed', impact: 'Infrastructure' },
];
