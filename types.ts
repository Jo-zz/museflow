
export enum BGMStyle {
  MINIMAL = 'Minimal',
  CINEMATIC = 'Cinematic',
  AMBIENT = 'Ambient',
  ORCHESTRAL = 'Orchestral',
  POST_ROCK = 'Post-Rock'
}

export enum BGMType {
  FULL = 'Full Track',
  HIGHLIGHT = 'Highlight/Hook'
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  style: BGMStyle;
  type: BGMType;
  duration: number; // in seconds
  url: string;
  cover: string;
  description: string;
}

export interface UserPreferences {
  likedIds: string[];
  dislikedIds: string[];
  preferredStyles: BGMStyle[];
}

export type AppView = 'discovery' | 'styles' | 'visual' | 'search';
