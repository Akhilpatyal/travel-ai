import { AIItinerary, TravelStyle, WeatherForecast, Member, Suggestion } from '../types/trip';

interface GenerateInput {
  destination: string;
  budget: number;
  days: number;
  travelStyle: TravelStyle;
  preferences: string[];
}

// Destination data for realistic recommendations
const destinationData: Record<string, {
  places: string[];
  activities: Record<TravelStyle, string[]>;
  food: string[];
  tips: string[];
}> = {
  default: {
    places: ['City Center', 'Local Market', 'Historic District', 'Waterfront', 'Cultural Museum', 'Nature Park', 'Viewpoint Hill', 'Old Town'],
    activities: {
      adventure: ['Rock climbing', 'Zip-lining', 'Hiking trails', 'White-water rafting', 'Paragliding', 'Kayaking'],
      cultural: ['Museum tours', 'Historical site visits', 'Local art gallery', 'Cultural workshops', 'Cooking class', 'Heritage walk'],
      relaxation: ['Spa & wellness', 'Sunset cruise', 'Yoga sessions', 'Beach lounging', 'Meditation retreat', 'Hot springs'],
      foodie: ['Street food tour', 'Fine dining experience', 'Cooking class', 'Local market tasting', 'Wine/beer tasting', 'Chef\'s table'],
      budget: ['Free walking tours', 'Local bus exploration', 'Street markets', 'Budget eateries', 'Free museum days', 'Public beaches'],
      luxury: ['Private tours', 'Helicopter sightseeing', 'Michelin dining', 'VIP experiences', 'Yacht charter', 'Private beach club'],
    },
    food: ['Local street food stalls', 'Traditional restaurant', 'Rooftop dining', 'Night market', 'Farm-to-table café', 'Seafood spot'],
    tips: ['Book accommodations early', 'Try local street food', 'Use public transport', 'Learn a few local phrases', 'Carry cash for small vendors'],
  },
  paris: {
    places: ['Eiffel Tower', 'The Louvre', 'Montmartre', 'Notre Dame', 'Champs-Élysées', 'Musée d\'Orsay', 'Palace of Versailles', 'Seine River'],
    activities: {
      adventure: ['Seine River kayaking', 'Catacombs tour', 'Bike through Bois de Boulogne', 'Rock climbing at Fontainebleau', 'Parkour workshop', 'Off-beat underground tours'],
      cultural: ['Louvre museum tour', 'Montmartre art walk', 'Paris Opera performance', 'Historic patisserie tour', 'French language class', 'Sacré-Cœur visit'],
      relaxation: ['Luxembourg Gardens picnic', 'Seine River cruise', 'Parisian spa day', 'Café hopping', 'Palais Royal stroll', 'Rooftop wine evening'],
      foodie: ['Croissant bakery tour', 'Michelin star dinner', 'French wine tasting', 'Cheese market visit', 'Cooking class in Marais', 'Macaron masterclass'],
      budget: ['Free museum Sundays', 'Picnic at Champ de Mars', 'Bike city tour', 'Street crêpes', 'Library visits', 'Free concert at Place des Vosges'],
      luxury: ['Private Louvre tour', 'Champagne at Ritz', 'Helicopter over Eiffel', 'Versailles VIP access', 'Private Seine dinner cruise', 'Shopping at Avenue Montaigne'],
    },
    food: ['Café de Flore', 'Le Jules Verne (Eiffel Tower)', 'L\'As du Fallafel', 'Breizh Café (crêpes)', 'Septime', 'Marché des Enfants Rouges'],
    tips: ['Buy a Paris Museum Pass', 'Avoid tourist traps near Eiffel Tower', 'Validate your metro ticket', 'Try crêpes from street stands', 'Visit Versailles on weekdays'],
  },
  tokyo: {
    places: ['Shibuya Crossing', 'Senso-ji Temple', 'Shinjuku', 'Harajuku', 'Akihabara', 'Mount Fuji (day trip)', 'Tsukiji Market', 'Odaiba'],
    activities: {
      adventure: ['Mount Fuji hike', 'Go-karting in Akihabara', 'VR gaming experience', 'Sumo wrestling tour', 'Ninja training class', 'Cycling around Arakawa'],
      cultural: ['Senso-ji temple visit', 'Tea ceremony experience', 'Kabuki theater show', 'Origami workshop', 'Samurai museum', 'Zen meditation session'],
      relaxation: ['Onsen (hot spring) soak', 'Shinjuku Gyoen picnic', 'Robot Restaurant', 'Cat café visit', 'Spa at Odaiba', 'Peaceful shrine walk'],
      foodie: ['Tsukiji sushi breakfast', 'Ramen tasting tour', 'Izakaya bar hopping', 'Tempura cooking class', 'Depachika food hall', 'Wagyu beef dinner'],
      budget: ['Free shrines & temples', 'Yen shops in Akihabara', 'Convenience store meals', 'Free observation decks', 'Harajuku street fashion', 'Public parks'],
      luxury: ['Aman Tokyo stay', 'Kaiseki dinner', 'Private geisha dinner', 'Mount Fuji private tour', 'Helicopter over the city', 'Shopping in Ginza'],
    },
    food: ['Tsukiji Outer Market', 'Ichiran Ramen', 'Sushi Saito', 'Gonpachi (Kill Bill restaurant)', 'Tofu-ya Ukai', 'Depachika basement food halls'],
    tips: ['Get a Suica card for transit', 'Bow when greeting locals', 'Carry cash (many places are cash-only)', 'Buy a pocket WiFi', 'Avoid rush hour on trains'],
  },
  bali: {
    places: ['Ubud Rice Terraces', 'Tanah Lot Temple', 'Seminyak Beach', 'Sacred Monkey Forest', 'Uluwatu Cliff Temple', 'Tegallalang', 'Nusa Penida', 'Kuta'],
    activities: {
      adventure: ['Surfing at Kuta', 'Mount Batur sunrise hike', 'White water rafting', 'Cliff jumping at Blue Lagoon', 'Scuba diving at Menjangan', 'ATV jungle ride'],
      cultural: ['Balinese dance show', 'Traditional cooking class', 'Temple ceremonies', 'Silver jewelry workshop', 'Batik painting class', 'Gamelan music lesson'],
      relaxation: ['Ubud spa & yoga', 'Rice terrace walk', 'Sunset at Seminyak', 'Floating breakfast', 'Meditation retreat', 'Beachside massage'],
      foodie: ['Warungs (local eateries)', 'Seminyak food tour', 'Babi guling (suckling pig)', 'Ubud organic café', 'Beachside BBQ', 'Fruit market visit'],
      budget: ['Free temple visits (with sarong)', 'Local warungs', 'Public beaches', 'Motorbike rental', 'Sunset viewpoints', 'Night markets'],
      luxury: ['Private villa with pool', 'Helicopter over volcanoes', 'Private boat to Nusa Penida', 'Amandari resort spa', 'Private chef dinner', 'Alila Soori stay'],
    },
    food: ['Locavore (fine dining Ubud)', 'Bumbu Bali', 'Merah Putih', 'La Plancha (sunset bar)', 'Warung Ibu Oka (suckling pig)', 'Cafe Pomegranate'],
    tips: ['Dress respectfully at temples', 'Bargain at markets', 'Rent a scooter for freedom', 'Stay hydrated in humidity', 'Visit temples at sunrise to avoid crowds'],
  },
  dubai: {
    places: ['Burj Khalifa', 'Dubai Mall', 'Palm Jumeirah', 'Desert Safari', 'Dubai Creek', 'Gold Souk', 'Burj Al Arab', 'Museum of the Future'],
    activities: {
      adventure: ['Desert dune bashing', 'Skydiving over the Palm', 'Indoor ski at Ski Dubai', 'Jet ski on Dubai Creek', 'Hot air balloon safari', 'Deep sea fishing'],
      cultural: ['Dubai Creek Dhow cruise', 'Al Fahidi Historic District', 'Gold & Spice Souk', 'Museum of the Future', 'Heritage village tour', 'Arabic calligraphy class'],
      relaxation: ['Luxury beach clubs', 'Burj Al Arab afternoon tea', 'Desert glamping', 'Hammam spa experience', 'Pool day at Atlantis', 'Sunset at Dubai Frame'],
      foodie: ['Spice Souk exploration', 'Emirati cuisine lunch', 'Rooftop fine dining', 'Michelin dining in DIFC', 'Night food market', 'Arabic coffee & dates'],
      budget: ['Free beach access', 'Deira food stalls', 'Metro exploration', 'Abra (water taxi) rides', 'Free Dubai Fountain show', 'Heritage area walks'],
      luxury: ['Burj Al Arab suite stay', 'Private desert safari', 'Yacht charter in Marina', 'Helicopter over Palm', 'At.mosphere dining (Burj)', 'Private Burj Khalifa access'],
    },
    food: ['Nobu Dubai', 'Zuma', 'Al Hadheerah (Bab Al Shams)', 'Bu Qtair Fish Restaurant', 'Ravi Restaurant (Pakistani)', 'Pierchic (over the sea)'],
    tips: ['Dress modestly in public', 'Avoid alcohol in non-licensed places', 'Book Burj Khalifa in advance', 'Use Careem/Uber for transport', 'Stay hydrated in heat'],
  },
  'new york': {
    places: ['Central Park', 'Times Square', 'Brooklyn Bridge', 'The Met', 'High Line', 'Statue of Liberty', 'MOMA', 'Empire State Building'],
    activities: {
      adventure: ['Kayaking on Hudson River', 'Rock climbing in Central Park', 'Brooklyn Bridge walk', 'Cycling the High Line', 'Urban escape rooms', 'Rooftop bar hopping'],
      cultural: ['MET museum tour', 'Broadway show', 'Harlem jazz night', 'MOMA art walk', 'Brooklyn art galleries', 'NYC Architecture tour'],
      relaxation: ['Central Park picnic', 'Spa in Midtown', 'Brooklyn Botanic Garden', 'Hudson River sunset walk', 'Rooftop yoga class', 'Book browsing at Strand'],
      foodie: ['Katz\'s Delicatessen', 'Smorgasburg food market', 'Chinatown food tour', 'Chelsea Market visit', 'Fine dining in Tribeca', 'Bagel breakfast crawl'],
      budget: ['Free museum Fridays', 'Staten Island Ferry', 'Food truck meals', 'Walk the High Line', 'Free concerts in parks', 'Public library visits'],
      luxury: ['Suite at The Plaza', 'Per Se dinner', 'Private Central Park carriage', 'Helicopter over Manhattan', 'Private yacht charter', 'VIP Broadway backstage'],
    },
    food: ['Katz\'s Deli', 'Le Bernardin', 'Shake Shack', 'Momofuku Noodle Bar', 'Smorgasburg', 'Joe\'s Pizza'],
    tips: ['Get an NYC Metro card', 'Walk as much as possible', 'Book Broadway tickets early', 'Avoid Times Square restaurants', 'Best views from Brooklyn'],
  },
};

function getDestinationData(destination: string) {
  const key = destination.toLowerCase();
  for (const k of Object.keys(destinationData)) {
    if (k !== 'default' && key.includes(k)) return destinationData[k];
  }
  return destinationData.default;
}

function generateDayThemes(days: number, style: TravelStyle): string[] {
  const themes: Record<TravelStyle, string[]> = {
    adventure: ['Arrival & First Thrills', 'Into the Wild', 'Extreme & Exhilarating', 'Hidden Trails', 'Summit Day', 'Epic Finale', 'Adventure Wrap-up'],
    cultural: ['Arrival & Orientation', 'Historical Immersion', 'Art & Architecture', 'Local Life & Markets', 'Spiritual & Heritage', 'Workshop Day', 'Cultural Farewell'],
    relaxation: ['Arrival & Unwind', 'Slow Morning Vibes', 'Spa & Serenity', 'Nature & Peace', 'Leisure & Local Charm', 'Sunset Reflections', 'Final Relaxation'],
    foodie: ['Arrival & First Bites', 'Street Food Safari', 'Fine Dining Night', 'Market & Cooking Class', 'Hidden Gems Eateries', 'Tasting Menu Day', 'Farewell Feast'],
    budget: ['Arrival & Free Exploration', 'Free Attractions Day', 'Local Transport Adventure', 'Street & Market Day', 'Budget Activities', 'Last Cheap Thrills', 'Free Walks Farewell'],
    luxury: ['Grand Arrival', 'VIP Experiences', 'Private Tours Day', 'Exclusive Dining', 'Helicopter & Yacht', 'Spa & Indulgence', 'Luxury Farewell'],
  };
  const pool = themes[style];
  return Array.from({ length: days }, (_, i) => pool[i % pool.length]);
}

function generateMockWeather(destination: string): WeatherForecast[] {
  const conditions: WeatherForecast['condition'][] = ['sunny', 'cloudy', 'rainy', 'sunny', 'cloudy'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const startDay = new Date().getDay();

  // Baseline temps for destinations
  const baseTemps: Record<string, number> = {
    tokyo: 22, paris: 18, bali: 30, dubai: 38, 'new york': 20, default: 25
  };

  const key = Object.keys(baseTemps).find(k => destination.toLowerCase().includes(k)) || 'default';
  const base = baseTemps[key];

  return Array.from({ length: 5 }, (_, i) => {
    const dayName = days[(startDay + i) % 7];
    const cond = conditions[i % conditions.length];
    return {
      day: dayName,
      temp: { high: base + Math.floor(Math.random() * 5), low: base - Math.floor(Math.random() * 5) },
      condition: cond,
      description: cond === 'sunny' ? 'Clear skies' : cond === 'rainy' ? 'Light showers' : 'Partly cloudy',
    };
  });
}

export async function generateItinerary(input: GenerateInput): Promise<AIItinerary> {
  // Simulate AI thinking delay
  await new Promise(r => setTimeout(r, 2200));

  const data = getDestinationData(input.destination);
  const styleActivities = data.activities[input.travelStyle];
  const themes = generateDayThemes(input.days, input.travelStyle);

  // Budget breakdown (realistic percentages)
  const b = input.budget;
  const estimatedCostBreakdown = {
    accommodation: Math.round(b * 0.35),
    food: Math.round(b * 0.25),
    activities: Math.round(b * 0.20),
    transport: Math.round(b * 0.20),
  };

  // Generate day plans
  const dayPlans = Array.from({ length: input.days }, (_, i) => {
    const morningIdx = (i * 2) % styleActivities.length;
    const afternoonIdx = (i * 2 + 1) % styleActivities.length;
    const placeIdx = i % data.places.length;
    const foodIdx = i % data.food.length;

    return {
      day: i + 1,
      theme: themes[i],
      morning: i === 0
        ? `Check in & settle at hotel, explore ${data.places[placeIdx]}`
        : `${styleActivities[morningIdx]} at ${data.places[placeIdx]}`,
      afternoon: i === input.days - 1
        ? `Last-minute shopping & packing, airport transfer`
        : `${styleActivities[afternoonIdx]} — explore the local neighborhood`,
      evening: i === 0
        ? `Welcome dinner at ${data.food[foodIdx]}, evening stroll`
        : i === input.days - 1
        ? `Farewell dinner at ${data.food[(foodIdx + 1) % data.food.length]}`
        : `${data.food[foodIdx]} for dinner, evening leisure`,
      food: data.food[(i + 1) % data.food.length],
    };
  });

  const places = data.places.slice(0, Math.min(6, data.places.length));
  const activities = styleActivities.slice(0, Math.min(6, styleActivities.length));
  const foodRecommendations = data.food.slice(0, Math.min(5, data.food.length));

  // Add preference-based tips
  const prefTips = input.preferences.map(p => `Great for ${p} lovers: ask locals for hidden ${p} spots`);
  const tips = [...data.tips, ...prefTips].slice(0, 6);

  const weather = generateMockWeather(input.destination);

  return {
    places,
    activities,
    foodRecommendations,
    dayPlans,
    tips,
    weather,
    estimatedCostBreakdown,
  };
}

export function analyzeGroupPreferences(members: Member[], suggestions: Suggestion[]): string {
  if (members.length === 0) return "Add members to see group intelligence insights.";

  const preferences = members.map(m => m.preference.toLowerCase());
  const budgets = members.map(m => m.budgetPreference);
  
  let insight = "Based on your group dynamics: ";
  
  // Budget insight
  const lowBudgets = budgets.filter(b => b === 'low').length;
  if (lowBudgets > members.length / 2) {
    insight += "We recommend focusing on budget-friendly activities as most members prefer low-cost options. ";
  } else {
    insight += "A balanced mid-range budget seems optimal for the group. ";
  }

  // Preference insight
  const allPrefs = [...preferences, ...suggestions.map(s => s.content.toLowerCase())];
  const uniquePrefs = Array.from(new Set(allPrefs));
  
  if (uniquePrefs.some(p => p.includes('food') || p.includes('eat'))) {
    insight += "There is a strong interest in culinary experiences. ";
  }
  if (uniquePrefs.some(p => p.includes('nature') || p.includes('hike') || p.includes('outdoor'))) {
    insight += "Outdoor and nature-based activities will be a big hit! ";
  }

  const suggestionCount = suggestions.length;
  if (suggestionCount > 0) {
    insight += `You have ${suggestionCount} suggestions on the board — the group is leaning towards a mix of ${suggestions[0].type}s and more.`;
  }

  return insight;
}
