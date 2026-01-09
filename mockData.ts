
import { BGMStyle, BGMType, Track } from './types';

// --- Data Generation Helpers ---

// Refined adjectives: Focusing on smooth, vast, and timeless qualities
const ADJECTIVES = [
  'Endless', 'Suspended', 'Hollow', 'Fading', 'Distant', 'Ethereal', 'Still', 'Infinite', 
  'Blurred', 'Glass', 'Paper', 'Silent', 'Slow', 'Gentle', 'Wandering', 'Pale', 
  'Hidden', 'Inner', 'Vast', 'Weightless', 'Submerged', 'Static', 'Drifting', 'Golden',
  'Broken', 'Quiet', 'Last', 'First'
];

// Nouns: Abstract concepts, nature elements, post-rock imagery
const NOUNS = [
  'Horizon', 'Signal', 'Reverb', 'Transmission', 'Echo', 'Dust', 'Light', 'Shadow', 
  'Currents', 'Tides', 'Silence', 'Snow', 'Dawn', 'Threads', 'Maps', 'Ghosts', 
  'Breath', 'Space', 'Clouds', 'Fields', 'Patterns', 'Fragments', 'Dreams', 'Sleep',
  'Distance', 'Warmth', 'Cold'
];

// --- REAL AUDIO SOURCES (Verified Wikimedia Commons MP3s) ---
// These are transcoded MP3 URLs which are highly compatible and reliable.
const REAL_AMBIENT_URLS = [
  // Erik Satie - Gymnopédie No. 1
  'https://upload.wikimedia.org/wikipedia/commons/transcoded/3/35/Gymnopedie_No_1.ogg/Gymnopedie_No_1.ogg.mp3',
  
  // Debussy - Clair de Lune
  'https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f5/Clair_de_lune_%28Debussy%29_-_Laurens_Goedhart.ogg/Clair_de_lune_%28Debussy%29_-_Laurens_Goedhart.ogg.mp3',
  
  // Bach - Cello Suite No. 1 (Prelude)
  'https://upload.wikimedia.org/wikipedia/commons/transcoded/d/d6/J.S.Bach_-_Cello_Suite_No._1_in_G_Major%2C_BWV_1007_-_I._Prelude.ogg/J.S.Bach_-_Cello_Suite_No._1_in_G_Major%2C_BWV_1007_-_I._Prelude.ogg.mp3',
  
  // Holst - The Planets: Venus, the Bringer of Peace
  'https://upload.wikimedia.org/wikipedia/commons/transcoded/4/4e/Holst-_venus.ogg/Holst-_venus.ogg.mp3',
  
  // Erik Satie - Gnossienne No. 1
  'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/22/Erik_Satie_-_Gnossienne_1.ogg/Erik_Satie_-_Gnossienne_1.ogg.mp3',

  // Beethoven - Moonlight Sonata
  'https://upload.wikimedia.org/wikipedia/commons/transcoded/1/15/Beethoven_-_Moonlight_Sonata.ogg/Beethoven_-_Moonlight_Sonata.ogg.mp3',
  
  // Chopin - Nocturne Op. 9 No. 2
  'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/29/Chopin_-_Nocturne_Op_9_No_2_-_E_Flat_Major.ogg/Chopin_-_Nocturne_Op_9_No_2_-_E_Flat_Major.ogg.mp3'
];

// Specific datasets tailored for Pure Atmosphere & Post-Rock
const THEMES = {
  // 1. Post-Rock / Atmospheric: The core request (Athletics style)
  POST_ROCK: {
    styles: [BGMStyle.POST_ROCK, BGMStyle.CINEMATIC], 
    titles: ['III', 'IV', 'Who You Are', 'Stop', 'Stay', 'Find', 'Maps', 'Open', 'See', 'Us', 'Reverb', 'Signal', 'We Are All Where We Belong', 'Your Hand In Mine', 'First Breath After Coma'],
    descriptions: [
      'Clean electric guitar with heavy delay and reverb, no drums.',
      'Slow-building crescendo rising from silence to a wall of sound.',
      'Melancholic guitar picking for emotional storytelling.',
      'Cinematic textures that feel like a distant memory.',
      'A vast soundscape evoking feelings of longing and distance.'
    ],
    covers: [
      'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=400&q=80', // Leaves/Abstract
      'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=400&q=80', // Starry Sky
      'https://images.unsplash.com/photo-1536766820879-059fec98ec0a?w=400&q=80', // Reaching Hand
      'https://images.unsplash.com/photo-1504333638930-c8787321eee0?w=400&q=80', // Foggy
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80'  // Abstract Lights
    ]
  },
  // 2. Nature / Ambient: Smooth textures, no beats
  NATURE_AMBIENT: {
    styles: [BGMStyle.AMBIENT, BGMStyle.ORCHESTRAL],
    titles: ['Wilderness', 'Depths', 'Migration', 'Flora', 'Canopy', 'Ice', 'Tundra', 'Drift', 'Flow', 'Growth'],
    descriptions: [
      'Deep, drone-based ambient pads for underwater or space scenes.',
      'Slow-moving orchestral strings for vast, empty landscapes.',
      'Intimate piano with natural room noise, absolute silence in background.',
      'Wind instruments blending into a soft synthesizer bed.',
      'Minimalist textures that leave room for voiceovers.'
    ],
    covers: [
      'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400&q=80', // Arctic
      'https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=400&q=80', // Forest
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80', // Peak
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80'  // Misty Beach
    ]
  },
  // 3. Emotional / Minimal: Piano & Cello focus
  EMOTIONAL_MINIMAL: {
    styles: [BGMStyle.MINIMAL, BGMStyle.CINEMATIC],
    titles: ['Regret', 'Hope', 'Childhood', 'Letters', 'Time', 'Goodbye', 'Healing', 'Scars', 'Distance', 'Portrait'],
    descriptions: [
      'A solitary piano playing a slow, reflective melody.',
      'Minimalist cello notes held for long durations.',
      'Soft, hopeful strings for moments of resolution.',
      'Bittersweet textures for nostalgic flashbacks.',
      'Silence and space between notes to create tension.'
    ],
    covers: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&q=80', // Landscape
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=400&q=80', // Mountain
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80', // Stars
      'https://images.unsplash.com/photo-1516575334481-f85287c2c81d?w=400&q=80'  // Window
    ]
  }
};

const ARTISTS = [
  'The Athletics', 'Explosions in the Void', 'Silent Poets', 'Ethereal Journeys', 'Frost Echo', 
  'Cinematic Minds', 'Analog Dreams', 'Paper Kites', 'Slow Dive', 'Distant Lights', 'Northern Sky',
  'The Composer', 'Soft Focus', 'Memory Tapes', 'Echo & The Tide', 'Winter Hours', 'Hammock Styles'
];

function generateTracks(count: number): Track[] {
  const tracks: Track[] = [];
  
  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let themeKey: keyof typeof THEMES;
    
    // Weighted heavily towards Post-Rock/Atmospheric (50%)
    if (rand < 0.50) themeKey = 'POST_ROCK';
    else if (rand < 0.80) themeKey = 'NATURE_AMBIENT'; 
    else themeKey = 'EMOTIONAL_MINIMAL';

    const theme = THEMES[themeKey];
    
    // Random components
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const specificTitle = theme.titles[Math.floor(Math.random() * theme.titles.length)];
    
    // Construct Title
    const titleFormat = Math.random();
    let title = '';
    if (titleFormat < 0.25) title = specificTitle; 
    else if (titleFormat < 0.5) title = `${adjective} ${specificTitle}`;
    else if (titleFormat < 0.75) title = `${specificTitle} ${noun}`;
    else title = `${adjective} ${noun}`;

    // Ensure we only use the allowed styles for this theme
    const style = theme.styles[Math.floor(Math.random() * theme.styles.length)];
    
    // Mostly Full Tracks
    const type = Math.random() > 0.15 ? BGMType.FULL : BGMType.HIGHLIGHT;
    
    // Longer durations for atmospheric tracks (3.5 min to 8 min)
    const duration = type === BGMType.HIGHLIGHT 
      ? Math.floor(Math.random() * 60) + 40 
      : Math.floor(Math.random() * 300) + 210; 
    
    // Select a real ambient track URL from our curated list
    const url = REAL_AMBIENT_URLS[Math.floor(Math.random() * REAL_AMBIENT_URLS.length)];
    
    tracks.push({
      id: (i + 1).toString(),
      title: title,
      artist: ARTISTS[Math.floor(Math.random() * ARTISTS.length)],
      style: style,
      type: type,
      duration: duration,
      url: url,
      cover: theme.covers[Math.floor(Math.random() * theme.covers.length)],
      description: theme.descriptions[Math.floor(Math.random() * theme.descriptions.length)]
    });
  }
  return tracks;
}

// Generate 1200 tracks
export const TRACKS: Track[] = generateTracks(1200);
