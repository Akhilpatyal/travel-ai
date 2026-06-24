'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Calendar, MapPin, Sparkles, ChevronRight,
  Loader2, Utensils, Sun, Cloud, CloudRain, Snowflake, CloudLightning,
  Users, MessageSquare, Brain, Heart, Navigation, Star, Globe, Building,
  CheckCircle, Zap, Target, Wallet, Gem, Backpack, Compass, Send, Bot,
  Sunrise, Sunset, Map, ThermometerSun, ShieldCheck
} from 'lucide-react';
import { Trip, TripFormData, TravelStyle, AIItinerary } from './types/trip';
import { tripStore } from './lib/tripStore';
import { generateItinerary } from './lib/aiEngine';

// --- Assets ---
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1920&q=80',
];

// Indonesia-themed destinations, now enriched with budget + best-time for premium cards
const BEST_LOCATIONS = [
  { name: 'Bromo, East Java', desc: 'Bromo Tengger Tour', img: 'https://images.unsplash.com/photo-1505993597083-3bd19fb75e57?auto=format&fit=crop&w=800&q=80', budget: '$45/day', bestTime: 'Apr – Oct' },
  { name: 'Denpasar, Bali', desc: 'Bali Beach Tourism', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80', budget: '$60/day', bestTime: 'May – Sep' },
  { name: 'Ubud, Bali', desc: 'Cultural Heritage', img: 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=800&q=80', budget: '$50/day', bestTime: 'Apr – Oct' },
  { name: 'Borobudur, Magelang', desc: 'Ancient Temple Tour', img: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80', budget: '$40/day', bestTime: 'May – Sep' },
];

const AI_FEATURES = [
  { icon: <Wallet />, title: 'Budget Planner', desc: 'Smart allocation across stays, food, activities and transport — before you spend a rupiah.' },
  { icon: <Gem />, title: 'Hidden Gems', desc: 'Off-the-tourist-trail spots surfaced from local signals, not generic listicles.' },
  { icon: <Backpack />, title: 'Smart Packing', desc: 'A packing list that adapts to your style, the forecast and trip length.' },
  { icon: <Users />, title: 'Group Planning', desc: 'Blend everyone’s preferences and budgets into one itinerary that works.' },
  { icon: <Bot />, title: 'AI Travel Advisor', desc: 'Ask anything — timing, safety, routes — and get decisions, not search results.' },
];

// Sample itinerary used purely for the marketing preview on the landing page
const SAMPLE_ITINERARY = [
  { day: 1, theme: 'Arrival & First Impressions', stops: [
    { time: 'Morning', icon: <Navigation size={18} />, title: 'Arrival & hotel check-in', desc: 'Settle in, freshen up, and grab a welcome coffee.' },
    { time: 'Afternoon', icon: <Utensils size={18} />, title: 'Local food crawl', desc: 'Warung-hopping through the neighbourhood’s best bites.' },
    { time: 'Evening', icon: <Sunset size={18} />, title: 'Sunset viewpoint', desc: 'Golden hour over the bay with a fresh coconut in hand.' },
  ]},
  { day: 2, theme: 'Adventure & Night Markets', stops: [
    { time: 'Morning', icon: <Compass size={18} />, title: 'Adventure activity', desc: 'Sunrise hike or a reef snorkel — your call.' },
    { time: 'Afternoon', icon: <Map size={18} />, title: 'Cultural landmark', desc: 'A guided wander through temples and old town.' },
    { time: 'Evening', icon: <Sparkles size={18} />, title: 'Night market', desc: 'Street eats, live music, and souvenir hunting.' },
  ]},
];

// --- Helpers ---
const weatherIcon = (condition: string, size = 16) => {
  switch (condition) {
    case 'sunny': return <Sun size={size} />;
    case 'rainy': return <CloudRain size={size} />;
    case 'snowy': return <Snowflake size={size} />;
    case 'stormy': return <CloudLightning size={size} />;
    default: return <Cloud size={size} />;
  }
};

const timeMeta: Record<string, { icon: React.ReactNode; label: string }> = {
  morning: { icon: <Sunrise size={18} />, label: 'Morning' },
  afternoon: { icon: <Sun size={18} />, label: 'Afternoon' },
  evening: { icon: <Sunset size={18} />, label: 'Evening' },
  food: { icon: <Utensils size={18} />, label: 'Dinner & food' },
};

function buildPackingList(trip: Trip): string[] {
  const base = ['Passport & travel docs', 'Phone + charger', 'Universal adapter', 'Any medications', 'Reusable water bottle'];
  const styleItems: Record<TravelStyle, string[]> = {
    adventure: ['Trail/hiking shoes', 'Quick-dry clothing', 'Compact daypack'],
    cultural: ['Modest temple wear', 'Comfortable walking shoes', 'Small notebook'],
    relaxation: ['Swimwear', 'Sunscreen SPF 50', 'A good book'],
    foodie: ['Light layers', 'Antacids (just in case)', 'Appetite'],
    budget: ['Refillable snack bag', 'Coin pouch', 'Offline maps downloaded'],
    luxury: ['Smart evening outfit', 'Sunglasses', 'Premium toiletries'],
  };
  const items = [...base, ...(styleItems[trip.travelStyle] || [])];
  const conditions = trip.itinerary?.weather.map(w => w.condition) || [];
  if (conditions.includes('rainy') || conditions.includes('stormy')) items.push('Compact umbrella / rain jacket');
  if (conditions.includes('sunny')) items.push('Hat & sunglasses');
  if (conditions.includes('snowy')) items.push('Warm layers');
  return items;
}

// Lightweight natural-language parse so the planner chat feels conversational
const KNOWN_DESTINATIONS = ['bali', 'ubud', 'bromo', 'borobudur', 'java', 'jakarta', 'lombok', 'komodo', 'tokyo', 'paris', 'dubai', 'new york', 'thailand', 'goa', 'manali'];

function parsePlannerPrompt(text: string): TripFormData | null {
  const lower = text.toLowerCase();
  let destination = '';
  const toMatch = lower.match(/\bto\s+([a-z][a-z\s]*?)(?:\s+for|\s+with|\s+on|\s+in|,|$)/);
  if (toMatch) destination = toMatch[1].trim();
  if (!destination) {
    const found = KNOWN_DESTINATIONS.find(d => lower.includes(d));
    if (found) destination = found;
  }
  if (!destination) return null;

  const daysMatch = lower.match(/(\d+)\s*(?:day|days|night|nights)/);
  const days = daysMatch ? Math.min(Number(daysMatch[1]), 10) : 4;

  const budgetMatch = lower.match(/\$?\s?(\d{3,7})\b/);
  const budget = budgetMatch ? Number(budgetMatch[1]) : 1500;

  const styleMap: { key: TravelStyle; words: string[] }[] = [
    { key: 'luxury', words: ['luxury', 'lux', 'premium', '5 star', 'five star'] },
    { key: 'adventure', words: ['adventure', 'hike', 'trek', 'surf', 'dive', 'thrill'] },
    { key: 'cultural', words: ['cultur', 'temple', 'heritage', 'history', 'museum'] },
    { key: 'foodie', words: ['food', 'eat', 'culinary', 'cuisine'] },
    { key: 'budget', words: ['budget', 'cheap', 'backpack'] },
    { key: 'relaxation', words: ['relax', 'chill', 'beach', 'spa', 'calm'] },
  ];
  let travelStyle: TravelStyle = 'adventure';
  for (const s of styleMap) { if (s.words.some(w => lower.includes(w))) { travelStyle = s.key; break; } }

  return {
    destination: destination.replace(/\b\w/g, c => c.toUpperCase()),
    budget, days, travelStyle, preferences: [],
  };
}

// --- Sub-Components ---

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {HERO_IMAGES.map((img, i) => (
        <div key={i} className="hero-slide" style={{ backgroundImage: `url(${img})`, opacity: current === i ? 1 : 0, zIndex: current === i ? 1 : 0 }}>
          <div className="hero-overlay"></div>
        </div>
      ))}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {HERO_IMAGES.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-500 ${current === i ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} />
        ))}
      </div>
    </div>
  );
};

// Scroll-reveal wrapper — light, no animation library needed
const Reveal = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`}>{children}</div>;
};

// Vertical timeline for a single day — used in planner + sample preview
const DayTimeline = ({ stops }: { stops: { time: string; icon: React.ReactNode; title: string; desc: string }[] }) => (
  <div className="timeline">
    {stops.map((stop, i) => (
      <div key={i} className="timeline-stop">
        <div className="timeline-rail">
          <div className="timeline-dot" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#fff' }}>
            {stop.icon}
          </div>
          {i < stops.length - 1 && <div className="timeline-line" />}
        </div>
        <div className="timeline-card-body">
          <p className="text-[10px] font-black uppercase tracking-widest text-accent-primary mb-1">{stop.time}</p>
          <h5 className="font-bold text-base mb-1">{stop.title}</h5>
          <p className="text-sm opacity-60 leading-relaxed">{stop.desc}</p>
        </div>
      </div>
    ))}
  </div>
);

export default function TravelAI() {
  const [view, setView] = useState<'landing' | 'app' | 'discovery' | 'results' | 'all_destinations'>('landing');
  const [discoveryItem, setDiscoveryItem] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Hero search planner — now includes all 5 requested fields
  const [plannerData, setPlannerData] = useState({
    destination: '', budget: '', dates: '', style: 'adventure' as TravelStyle, travelers: '2',
  });

  // Planner chat thread
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Hi! I’m your AI travel advisor. Tell me where you’d like to go — e.g. “Plan a 5 day cultural trip to Ubud for $1500”.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTrips(tripStore.getAll());
    const unsubscribe = tripStore.subscribe(setTrips);
    return () => { unsubscribe(); };
  }, []);

  // Keep the selected trip in sync as the store updates (itinerary finishes generating)
  useEffect(() => {
    if (selectedTrip) {
      const fresh = trips.find(t => t.id === selectedTrip.id);
      if (fresh && fresh !== selectedTrip) setSelectedTrip(fresh);
    }
  }, [trips]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, selectedTrip?.isGenerating]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const generateForTrip = async (newTrip: Trip, data: TripFormData) => {
    tripStore.update(newTrip.id, { isGenerating: true });
    try {
      const itinerary = await generateItinerary(data);
      tripStore.update(newTrip.id, { itinerary, isGenerating: false });
      showToast('Smart itinerary ready!');
      return itinerary;
    } catch {
      tripStore.update(newTrip.id, { isGenerating: false });
      showToast('AI engine error.');
      return null;
    }
  };

  const handleCreateTrip = async (data: TripFormData) => {
    const newTrip = tripStore.create(data);
    setIsModalOpen(false);
    setSelectedTrip(newTrip);
    showToast('AI trip initialized!');
    await generateForTrip(newTrip, data);
  };

  const handlePlannerChat = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput('');
    setChatLog(prev => [...prev, { role: 'user', text }]);

    const parsed = parsePlannerPrompt(text);
    if (!parsed) {
      setChatLog(prev => [...prev, { role: 'ai', text: 'I couldn’t catch a destination there. Try something like “Plan a 4 day trip to Bali for $1200”.' }]);
      return;
    }

    setChatLog(prev => [...prev, {
      role: 'ai',
      text: `On it — drafting a ${parsed.days}-day ${parsed.travelStyle} plan for ${parsed.destination} on a $${parsed.budget} budget. Generating your itinerary…`,
    }]);
    const newTrip = tripStore.create(parsed);
    setSelectedTrip(newTrip);
    await generateForTrip(newTrip, parsed);
    setChatLog(prev => [...prev, { role: 'ai', text: `Your ${parsed.destination} itinerary is ready on the right. Want me to tweak the budget, days, or style?` }]);
  };

  const handleAISearch = () => {
    if (!plannerData.destination) { showToast('Enter a destination first!'); return; }
    setRecommendations({
      destination: plannerData.destination,
      hotels: [
        { name: 'Grand Hyatt ' + plannerData.destination, rating: 4.8, price: '$180 – $240 / night', location: 'City Center · 2 min to landmarks', why: 'Best value luxury for your budget', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80' },
        { name: 'Urban Zen Boutique', rating: 4.6, price: '$95 – $130 / night', location: 'Old Town · walkable to night market', why: 'Highly rated by solo & couple travelers', img: 'https://images.unsplash.com/photo-1551882547-ff43c63ef53e?auto=format&fit=crop&w=600&q=80' },
        { name: 'Riverside Eco Lodge', rating: 4.7, price: '$70 – $110 / night', location: 'Riverside · quiet, nature-facing', why: 'Matches your adventure style', img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80' },
      ],
      places: ['Central Landmark', 'Ancient Temple', 'Old Town Square'],
      food: ['Local Night Market', 'Skyline Diner', 'Authentic ' + plannerData.destination + ' Bistro'],
      activities: ['Sunset Photography Walk', 'Local Cooking Class', 'Hidden Gems Tour'],
    });
    setView('results');
    showToast('AI is analyzing your journey...');
  };

  // ===================== LANDING =====================
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-white text-black font-sans selection:bg-accent-primary selection:text-white">
        <nav className="absolute top-0 left-0 right-0 z-50 py-6 md:py-8 px-6 md:px-12 flex items-center justify-between">
          <div className="text-2xl md:text-3xl font-black outfit tracking-tighter text-white flex items-center gap-2">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center">
              <Navigation size={22} className="text-black" />
            </div>
            INDOTRAVI
          </div>
          <button onClick={() => setView('app')} className="px-6 md:px-10 py-2.5 md:py-3 bg-white text-black font-extrabold rounded-full text-xs md:text-sm hover:scale-105 transition-all shadow-xl">
            Launch AI Assistant
          </button>
        </nav>

        {/* Hero + full 5-field AI search form */}
        <section className="relative min-h-[100vh] flex flex-col items-center justify-center text-center px-5 pt-28 pb-16">
          <HeroSlider />
          <div className="relative z-10 max-w-6xl w-full animate-slideUp">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 mb-6">
              <Sparkles size={16} className="text-accent-amber" />
              <span className="text-xs font-bold uppercase tracking-widest text-white">Smart Journey Generator</span>
            </div>
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black mb-6 leading-[0.9] outfit tracking-tighter text-white">
              AI TRAVEL<br /><span className="opacity-50">REIMAGINED</span>
            </h1>
            <p className="text-base md:text-xl text-white/70 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
              Tell us your vibe and budget. Our AI curates a complete Indonesian journey in seconds.
            </p>

            {/* Search form — the main focus */}
            <div className="ai-search-container max-w-5xl mx-auto flex flex-col lg:flex-row items-stretch gap-2 text-left">
              <div className="ai-input-group">
                <p className="ai-label">Destination</p>
                <input placeholder="Where to?" className="ai-input" value={plannerData.destination}
                  onChange={(e) => setPlannerData({ ...plannerData, destination: e.target.value })} />
              </div>
              <div className="ai-input-group">
                <p className="ai-label">Travel Dates</p>
                <input type="date" className="ai-input cursor-pointer" value={plannerData.dates}
                  onChange={(e) => setPlannerData({ ...plannerData, dates: e.target.value })} />
              </div>
              <div className="ai-input-group">
                <p className="ai-label">Style</p>
                <select className="ai-input appearance-none cursor-pointer bg-transparent" value={plannerData.style}
                  onChange={(e) => setPlannerData({ ...plannerData, style: e.target.value as TravelStyle })}>
                  <option className="text-black" value="adventure">Adventure</option>
                  <option className="text-black" value="luxury">Luxury</option>
                  <option className="text-black" value="cultural">Cultural</option>
                  <option className="text-black" value="relaxation">Relaxation</option>
                  <option className="text-black" value="foodie">Foodie</option>
                  <option className="text-black" value="budget">Budget</option>
                </select>
              </div>
              <div className="ai-input-group">
                <p className="ai-label">Budget</p>
                <input placeholder="$1500" type="number" className="ai-input" value={plannerData.budget}
                  onChange={(e) => setPlannerData({ ...plannerData, budget: e.target.value })} />
              </div>
              <div className="ai-input-group">
                <p className="ai-label">Travelers</p>
                <input placeholder="2" type="number" min={1} className="ai-input" value={plannerData.travelers}
                  onChange={(e) => setPlannerData({ ...plannerData, travelers: e.target.value })} />
              </div>
              <button onClick={handleAISearch}
                className="px-8 py-4 lg:py-0 bg-white text-black font-black rounded-[30px] hover:bg-accent-primary hover:text-white transition-all duration-500 flex items-center justify-center gap-3 whitespace-nowrap">
                <Brain size={20} /> Generate Trip
              </button>
            </div>
          </div>
        </section>

        {/* Popular Destinations — enriched cards */}
        <section className="py-24 md:py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <Reveal>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-14 gap-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-1 bg-accent-primary rounded-full"></div>
                  <p className="text-accent-primary font-bold uppercase tracking-widest text-xs">AI Personalized Picks</p>
                </div>
                <h2 className="text-4xl md:text-6xl font-black outfit leading-none mb-6">Popular Indonesian<br />Destinations</h2>
                <p className="text-secondary text-lg" style={{ color: 'var(--text-secondary)' }}>Curated by our adaptive planning engine. Each pick comes ready to generate.</p>
              </div>
              <button onClick={() => setView('all_destinations')} className="px-8 py-3.5 border-2 border-black font-black rounded-full hover:bg-black hover:text-white transition-all whitespace-nowrap">
                Explore All Spots
              </button>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {BEST_LOCATIONS.map((loc, i) => (
              <Reveal key={i}>
                <div className="group bg-white rounded-[32px] overflow-hidden border border-[var(--ds-border)] shadow-sm hover:shadow-2xl transition-all duration-500 h-full flex flex-col">
                  <div className="relative aspect-[4/3] overflow-hidden cursor-pointer" onClick={() => { setDiscoveryItem(loc); setView('discovery'); }}>
                    <img src={loc.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" alt={loc.name} />
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin size={12} className="text-accent-primary" /> {loc.name.split(',')[0]}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h4 className="text-xl font-black outfit mb-4">{loc.desc}</h4>
                    <div className="flex items-center justify-between text-xs font-bold mb-5 mt-auto">
                      <span className="flex items-center gap-1.5 text-gray-500"><Wallet size={14} className="text-accent-secondary" /> {loc.budget}</span>
                      <span className="flex items-center gap-1.5 text-gray-500"><Calendar size={14} className="text-accent-amber" /> {loc.bestTime}</span>
                    </div>
                    <button onClick={() => { setPlannerData({ ...plannerData, destination: loc.name.split(',')[0] }); handleAISearch(); }}
                      className="w-full py-3 bg-black text-white rounded-2xl text-sm font-black hover:bg-accent-primary transition-all flex items-center justify-center gap-2">
                      <Zap size={16} /> Quick Generate
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How it Works */}
        <section className="py-24 md:py-32 px-6 md:px-12 bg-[#050810] text-white">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div className="text-center mb-20 max-w-2xl mx-auto">
                <p className="text-accent-primary font-bold uppercase tracking-widest text-xs mb-4">How It Works</p>
                <h2 className="text-4xl md:text-6xl font-black outfit leading-tight">Your perfect trip<br />in three steps</h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {[
                { icon: <Target />, step: '01', title: 'Tell Us About Your Trip', desc: 'Share your destination, budget and travel style. The AI starts learning your preferences instantly.' },
                { icon: <Brain />, step: '02', title: 'AI Creates Your Plan', desc: 'Millions of data points analyzed to build a day-by-day itinerary tuned to you.' },
                { icon: <Globe />, step: '03', title: 'Travel Smarter', desc: 'Get weather, budget tracking and packing — adapting as your trip evolves.' },
              ].map((s, i) => (
                <Reveal key={i}>
                  <div className="group p-8 rounded-[32px] bg-white/[0.03] border border-white/5 hover:border-accent-primary/40 transition-all duration-500 h-full">
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-all duration-500">
                        {s.icon}
                      </div>
                      <span className="text-5xl font-black text-white/10 outfit">{s.step}</span>
                    </div>
                    <h4 className="text-2xl font-bold mb-3">{s.title}</h4>
                    <p className="text-white/50 leading-relaxed">{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* AI Features */}
        <section className="py-24 md:py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <p className="text-accent-primary font-bold uppercase tracking-widest text-xs mb-4">Intelligence Built In</p>
              <h2 className="text-4xl md:text-6xl font-black outfit leading-tight mb-6">Everything you need<br />to decide before booking</h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>The AI travel intelligence platform — not another booking site.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AI_FEATURES.map((f, i) => (
              <Reveal key={i}>
                <div className="feature-card h-full">
                  <div className="feature-icon">{f.icon}</div>
                  <h4 className="text-xl font-black mb-3">{f.title}</h4>
                  <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Sample Itinerary Preview */}
        <section className="py-24 md:py-32 px-6 md:px-12 bg-[#F8FAFC]">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="text-center mb-16 max-w-2xl mx-auto">
                <p className="text-accent-primary font-bold uppercase tracking-widest text-xs mb-4">Sample Itinerary</p>
                <h2 className="text-4xl md:text-6xl font-black outfit leading-tight">Every day feels<br />like a journey</h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SAMPLE_ITINERARY.map((day) => (
                <Reveal key={day.day}>
                  <div className="bg-white rounded-[32px] p-8 border border-[var(--ds-border)] shadow-sm h-full text-black">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-accent-primary text-white flex items-center justify-center font-black text-lg">{day.day}</div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Day {day.day}</p>
                        <h4 className="text-xl font-black">{day.theme}</h4>
                      </div>
                    </div>
                    <DayTimeline stops={day.stops} />
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="text-center mt-12">
              <button onClick={() => setView('app')} className="btn-glow text-base py-4 px-12 mx-auto">
                <Sparkles size={18} /> Plan My Own Trip
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white text-black py-24 md:py-32 px-6 md:px-12 border-t border-gray-100">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
            <div className="max-w-sm">
              <h3 className="text-4xl font-black outfit mb-8 tracking-tighter">INDOTRAVI<span className="text-accent-primary">.AI</span></h3>
              <p className="text-gray-500 text-lg leading-relaxed mb-10">Next-generation travel intelligence for the modern explorer. The archipelago, reimagined by AI.</p>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all cursor-pointer"><Globe size={20} /></div>
                <div className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all cursor-pointer"><Heart size={20} /></div>
                <div className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all cursor-pointer"><MessageSquare size={20} /></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-20">
              <div>
                <h4 className="font-black text-xs uppercase tracking-widest mb-8">Ecosystem</h4>
                <ul className="space-y-4 text-gray-400 font-bold text-sm">
                  <li className="hover:text-black cursor-pointer">AI Assistant</li>
                  <li className="hover:text-black cursor-pointer">Smart Planner</li>
                  <li className="hover:text-black cursor-pointer">API Access</li>
                </ul>
              </div>
              <div>
                <h4 className="font-black text-xs uppercase tracking-widest mb-8">Community</h4>
                <ul className="space-y-4 text-gray-400 font-bold text-sm">
                  <li className="hover:text-black cursor-pointer">Travelers</li>
                  <li className="hover:text-black cursor-pointer">Ambassadors</li>
                  <li className="hover:text-black cursor-pointer">Guides</li>
                </ul>
              </div>
              <div className="col-span-2 md:col-span-1">
                <h4 className="font-black text-xs uppercase tracking-widest mb-8">Get Updates</h4>
                <div className="flex bg-gray-50 rounded-2xl p-2 border border-gray-100">
                  <input placeholder="Email" className="bg-transparent border-none outline-none px-4 flex-1 text-sm" />
                  <button className="bg-black text-white px-6 py-3 rounded-xl font-bold text-xs">Join</button>
                </div>
              </div>
            </div>
          </div>
        </footer>

        {toast && <div className="toast bg-black text-white px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-3 border border-white/10">
          <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></div>{toast}
        </div>}
      </div>
    );
  }

  // ===================== ALL DESTINATIONS =====================
  if (view === 'all_destinations') {
    return (
      <div className="min-h-screen bg-white animate-fadeIn">
        <nav className="p-6 md:p-8 px-6 md:px-12 bg-white flex justify-between items-center border-b border-gray-100 sticky top-0 z-50">
          <button onClick={() => setView('landing')} className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-bold">
            <ChevronRight size={20} className="rotate-180" /> Back
          </button>
          <div className="text-lg md:text-xl font-black outfit uppercase">ALL DESTINATIONS</div>
          <button onClick={() => setView('app')} className="px-6 md:px-8 py-3 bg-black text-white rounded-full font-bold text-sm">Launch AI</button>
        </nav>
        <div className="max-w-7xl mx-auto py-16 md:py-20 px-6">
          <div className="mb-12 md:mb-16">
            <h2 className="text-4xl md:text-6xl font-black outfit mb-4">The Archipelago</h2>
            <p className="text-gray-400 text-lg">Every corner of Indonesia has a story. Find yours.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...BEST_LOCATIONS, ...BEST_LOCATIONS].map((loc, i) => (
              <div key={i} onClick={() => { setDiscoveryItem(loc); setView('discovery'); }} className="group cursor-pointer">
                <div className="rounded-[32px] overflow-hidden aspect-[4/3] mb-6 shadow-xl">
                  <img src={loc.img} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                </div>
                <div className="px-2">
                  <p className="text-xs font-black text-accent-primary uppercase tracking-widest mb-2">{loc.name}</p>
                  <h4 className="text-2xl font-black outfit mb-2">{loc.desc}</h4>
                  <p className="text-gray-500 text-sm">Experience the ultimate {loc.name} adventure with AI-curated spots.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===================== RESULTS (premium hotel cards) =====================
  if (view === 'results' && recommendations) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] animate-fadeIn">
        <nav className="p-6 md:p-8 px-6 md:px-12 bg-white flex justify-between items-center shadow-sm sticky top-0 z-50">
          <button onClick={() => setView('landing')} className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-bold">
            <ChevronRight size={20} className="rotate-180" /> Modify Search
          </button>
          <div className="text-lg md:text-xl font-black outfit">INDOTRAVI<span className="text-accent-primary">.AI</span></div>
          <button onClick={() => setView('app')} className="px-6 md:px-8 py-3 bg-black text-white rounded-full font-bold text-sm">Open Full Planner</button>
        </nav>

        <div className="max-w-7xl mx-auto py-10 md:py-12 px-6">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-black mb-2">AI Recommendations for <span className="text-accent-primary capitalize">{recommendations.destination}</span></h1>
            <p className="text-gray-500">Based on your {plannerData.style} style{plannerData.budget && <> and ${plannerData.budget} budget</>}.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            <div className="lg:col-span-2 space-y-10">
              <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Building size={24} className="text-accent-primary" /> Recommended Stays</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {recommendations.hotels.map((hotel: any, i: number) => (
                    <div key={i} className="hotel-card group flex flex-col">
                      <div className="h-44 overflow-hidden relative">
                        <img src={hotel.img} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                        <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/95 backdrop-blur rounded-full text-xs font-black flex items-center gap-1">
                          <Star size={13} className="text-accent-amber fill-accent-amber" /> {hotel.rating}
                        </div>
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <h4 className="font-black text-lg mb-1">{hotel.name}</h4>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-3"><MapPin size={14} className="text-accent-primary" /> {hotel.location}</p>
                        <p className="text-accent-primary font-black mb-4">{hotel.price}</p>
                        <span className="why-pill mb-5"><Sparkles size={12} /> {hotel.why}</span>
                        <button className="mt-auto w-full py-3 border-2 border-black rounded-2xl text-sm font-black hover:bg-black hover:text-white transition-all">View Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Utensils size={24} className="text-accent-amber" /> Must-Try Food Spots</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {recommendations.food.map((f: any, i: number) => (
                    <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent-amber/10 flex items-center justify-center text-accent-amber flex-shrink-0"><Utensils size={18} /></div>
                      <span className="font-bold text-sm">{f}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <div className="bg-white p-8 rounded-[32px] shadow-lg border border-gray-100">
                <h4 className="text-xl font-bold mb-6 flex items-center gap-2"><MapPin size={20} className="text-accent-primary" /> Popular Places</h4>
                <ul className="space-y-4">
                  {recommendations.places.map((p: any, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-gray-600 font-medium border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-black text-white p-8 rounded-[32px] shadow-2xl">
                <h4 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles size={20} className="text-accent-amber" /> Ready for the full experience?</h4>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">Let our AI generate a complete day-by-day itinerary with weather, budget tracking and a packing list.</p>
                <button onClick={() => setView('app')} className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-accent-primary hover:text-white transition-all">Start Planning</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===================== DISCOVERY =====================
  if (view === 'discovery' && discoveryItem) {
    return (
      <div className="min-h-screen bg-white animate-fadeIn">
        <nav className="p-6 md:p-8 px-6 md:px-12 flex justify-between items-center border-b border-gray-100 sticky top-0 bg-white z-50">
          <button onClick={() => setView('landing')} className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-bold">
            <ChevronRight size={20} className="rotate-180" /> Back
          </button>
          <div className="text-lg md:text-xl font-black outfit uppercase tracking-tighter">INDOTRAVI<span className="text-accent-primary">.AI</span></div>
          <button onClick={() => setView('app')} className="btn-glow px-6 md:px-10 text-sm">Plan This Journey</button>
        </nav>
        <div className="max-w-7xl mx-auto py-12 px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start mb-20 md:mb-24">
            <div className="space-y-6 md:space-y-8">
              <div className="rounded-[40px] md:rounded-[60px] overflow-hidden aspect-[4/5] shadow-2xl">
                <img src={discoveryItem.img} className="w-full h-full object-cover" alt={discoveryItem.name} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="aspect-square rounded-3xl bg-gray-100 overflow-hidden"><img src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=300" className="w-full h-full object-cover" /></div>
                <div className="aspect-square rounded-3xl bg-gray-100 overflow-hidden"><img src="https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=300" className="w-full h-full object-cover" /></div>
                <div className="aspect-square rounded-3xl bg-gray-100 overflow-hidden"><img src="https://images.unsplash.com/photo-1596402184320-417d717867cd?auto=format&fit=crop&w=300" className="w-full h-full object-cover" /></div>
              </div>
            </div>
            <div className="lg:pt-10">
              <div className="inline-block px-4 py-1 bg-accent-primary/10 text-accent-primary rounded-full text-xs font-black uppercase mb-6 tracking-widest">Premium Insight</div>
              <h1 className="text-5xl md:text-7xl font-black outfit mb-8 tracking-tighter">{discoveryItem.name}</h1>
              <p className="text-gray-500 text-lg md:text-xl mb-10 md:mb-12 leading-relaxed font-medium">
                Experience {discoveryItem.name} like a local with AI-driven insights. The perfect balance of adventure and luxury, tailored to your vibe.
              </p>
              <div className="grid grid-cols-2 gap-6 md:gap-8 mb-12">
                <div className="p-6 bg-gray-50 rounded-3xl"><p className="text-3xl font-black mb-1">4.9/5</p><p className="text-[10px] uppercase font-black text-gray-400">Guest Rating</p></div>
                <div className="p-6 bg-gray-50 rounded-3xl"><p className="text-3xl font-black mb-1">{discoveryItem.budget || '$50/day'}</p><p className="text-[10px] uppercase font-black text-gray-400">Avg. Daily Cost</p></div>
              </div>
              <div className="space-y-6">
                <h4 className="text-xl font-bold flex items-center gap-2">Top Places &amp; Costs</h4>
                <div className="space-y-4">
                  {['Cultural Landmarks ($50)', 'City Center Explorer (Free)', 'Local Food Tour ($85)'].map((p, i) => (
                    <div key={i} className="flex justify-between items-center p-4 border border-gray-100 rounded-2xl">
                      <span className="font-bold">{p}</span><ChevronRight size={16} className="text-gray-300" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 p-10 md:p-20 rounded-[40px] md:rounded-[60px] bg-black text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10"><Globe size={200} /></div>
            <h3 className="text-3xl md:text-5xl font-black mb-6 outfit">Start your journey today</h3>
            <p className="text-gray-400 text-lg md:text-xl mb-10 md:mb-12 max-w-2xl mx-auto">Our AI engine curates your entire {discoveryItem.name} experience in under 10 seconds.</p>
            <button onClick={() => setView('app')} className="btn-glow text-base md:text-lg py-4 md:py-5 px-10 md:px-14 mx-auto">Generate My AI Plan</button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== PLANNER (ChatGPT-inspired 3-column) =====================
  const recentTrips = [...trips].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3);
  const sharedTrips = trips.filter(t => t.members.length > 0);
  const it: AIItinerary | undefined = selectedTrip?.itinerary;
  const packingList = selectedTrip ? buildPackingList(selectedTrip) : [];

  const TripPill = ({ trip }: { trip: Trip }) => (
    <div onClick={() => setSelectedTrip(trip)}
      className={`p-4 rounded-2xl cursor-pointer mb-3 border transition-all ${selectedTrip?.id === trip.id ? 'bg-accent-primary border-accent-primary text-white shadow-xl' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07]'}`}>
      <div className="flex justify-between items-center">
        <h3 className="font-bold capitalize truncate">{trip.destination}</h3>
        {trip.isGenerating && <Loader2 size={15} className="animate-spin opacity-60 flex-shrink-0" />}
      </div>
      <p className="text-[10px] uppercase font-bold opacity-60 mt-1.5">{trip.days} Days · ${trip.budget} · {trip.travelStyle}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050810] text-white p-4 md:p-8 selection:bg-accent-primary">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 md:mb-10 gap-6 max-w-[1500px] mx-auto">
        <div className="flex items-center gap-4 md:gap-6">
          <button onClick={() => setView('landing')} className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all flex-shrink-0">
            <ChevronRight size={22} className="rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black outfit tracking-tight flex items-center gap-2">
              INDOTRAVI <span className="text-accent-primary uppercase text-[10px] md:text-xs px-2 py-1 bg-accent-primary/10 rounded">AI Planner</span>
            </h1>
            <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Realtime Adaptive Planning</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-glow py-3.5 px-8 flex items-center gap-2 justify-center">
          <Plus size={20} /> New Trip
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-[1500px] mx-auto lg:h-[78vh]">
        {/* LEFT: Saved / Recent / Shared */}
        <aside className="lg:col-span-3 planner-panel p-5 overflow-y-auto hide-scrollbar order-2 lg:order-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2"><Compass size={14} /> Saved Trips</p>
          {trips.length === 0 ? (
            <div className="text-center py-10 opacity-20 text-sm">No trips yet</div>
          ) : trips.map(trip => <TripPill key={trip.id} trip={trip} />)}

          {recentTrips.length > 0 && <>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-8 mb-4 flex items-center gap-2"><Star size={14} /> Recent Plans</p>
            {recentTrips.map(trip => (
              <div key={trip.id} onClick={() => setSelectedTrip(trip)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all">
                <div className="w-8 h-8 rounded-lg bg-accent-primary/15 flex items-center justify-center text-accent-primary flex-shrink-0"><MapPin size={14} /></div>
                <span className="text-sm font-bold capitalize truncate">{trip.destination}</span>
              </div>
            ))}
          </>}

          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-8 mb-4 flex items-center gap-2"><Users size={14} /> Shared Trips</p>
          {sharedTrips.length === 0 ? (
            <div className="text-xs opacity-30 px-1">No shared trips yet — add members to collaborate.</div>
          ) : sharedTrips.map(trip => (
            <div key={trip.id} onClick={() => setSelectedTrip(trip)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all">
              <div className="w-8 h-8 rounded-lg bg-accent-secondary/15 flex items-center justify-center text-accent-secondary flex-shrink-0"><Users size={14} /></div>
              <span className="text-sm font-bold capitalize truncate">{trip.destination}</span>
            </div>
          ))}
        </aside>

        {/* CENTER: AI chat + generated plan */}
        <main className="lg:col-span-6 planner-panel flex flex-col order-1 lg:order-2 min-h-[60vh] lg:min-h-0">
          <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-5">
            {/* Chat thread */}
            {chatLog.map((m, i) => (
              <div key={i} className="flex gap-3 items-start">
                {m.role === 'ai' && <div className="w-8 h-8 rounded-xl bg-accent-primary/15 flex items-center justify-center text-accent-primary flex-shrink-0 mt-1"><Bot size={16} /></div>}
                <div className={m.role === 'ai' ? 'chat-bubble-ai' : 'chat-bubble-user'}>{m.text}</div>
              </div>
            ))}

            {/* Generated plan / skeleton */}
            {selectedTrip && (
              <div className="pt-4 border-t border-white/5 mt-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="px-3 py-1 bg-accent-primary/10 text-accent-primary rounded-full text-[10px] font-black uppercase mb-2 inline-block tracking-widest">Itinerary</div>
                    <h2 className="text-3xl font-black capitalize tracking-tight">{selectedTrip.destination}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-accent-primary">${selectedTrip.budget}</p>
                    <p className="text-[10px] uppercase font-black opacity-30">{selectedTrip.days} days</p>
                  </div>
                </div>

                {selectedTrip.isGenerating || !it ? (
                  <div className="space-y-4">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="p-6 rounded-[28px] bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="skeleton w-10 h-10 rounded-xl" />
                          <div className="skeleton h-4 w-40" />
                        </div>
                        <div className="space-y-3 pl-4">
                          <div className="skeleton h-3 w-3/4" />
                          <div className="skeleton h-3 w-2/3" />
                          <div className="skeleton h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                    <p className="text-center text-xs text-white/30 font-bold uppercase tracking-widest animate-pulse">AI is crafting your day-by-day plan…</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {it.dayPlans.map((day) => {
                      const stops = [
                        { time: timeMeta.morning.label, icon: timeMeta.morning.icon, title: 'Morning', desc: day.morning },
                        { time: timeMeta.afternoon.label, icon: timeMeta.afternoon.icon, title: 'Afternoon', desc: day.afternoon },
                        { time: timeMeta.evening.label, icon: timeMeta.evening.icon, title: 'Evening', desc: day.evening },
                        { time: timeMeta.food.label, icon: timeMeta.food.icon, title: 'Food', desc: day.food },
                      ];
                      return (
                        <div key={day.day} className="p-6 rounded-[28px] bg-white/[0.03] border border-white/5">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-accent-primary text-white flex items-center justify-center font-black">{day.day}</div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Day {day.day}</p>
                              <h4 className="text-lg font-bold">{day.theme}</h4>
                            </div>
                          </div>
                          <DayTimeline stops={stops} />
                        </div>
                      );
                    })}
                    {it.tips.length > 0 && (
                      <div className="p-6 rounded-[28px] bg-accent-primary/[0.07] border border-accent-primary/20">
                        <h4 className="font-bold mb-4 flex items-center gap-2"><Sparkles size={16} className="text-accent-primary" /> AI Travel Tips</h4>
                        <ul className="space-y-2.5">
                          {it.tips.map((tip, i) => (
                            <li key={i} className="text-sm opacity-70 flex items-start gap-2"><CheckCircle size={15} className="text-accent-secondary mt-0.5 flex-shrink-0" /> {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input bar */}
          <div className="p-4 border-t border-white/5">
            <div className="chat-input-bar">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePlannerChat(); }}
                placeholder="Plan a 5 day cultural trip to Ubud for $1500…" />
              <button onClick={handlePlannerChat} className="w-11 h-11 rounded-full bg-accent-primary text-white flex items-center justify-center hover:scale-105 transition-all flex-shrink-0">
                <Send size={18} />
              </button>
            </div>
          </div>
        </main>

        {/* RIGHT: Budget / Weather / Packing */}
        <aside className="lg:col-span-3 planner-panel p-5 overflow-y-auto hide-scrollbar order-3 space-y-6">
          {!selectedTrip ? (
            <div className="text-center py-16 opacity-20">
              <Brain size={48} className="mx-auto mb-4 text-accent-primary" />
              <p className="text-sm">Select or create a trip to see budget, weather and packing.</p>
            </div>
          ) : (
            <>
              {/* Budget breakdown */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2"><Wallet size={14} /> Budget Breakdown</p>
                {it ? (
                  <div className="space-y-3">
                    {([
                      ['Accommodation', it.estimatedCostBreakdown.accommodation, 'var(--accent-primary)'],
                      ['Food', it.estimatedCostBreakdown.food, 'var(--accent-secondary)'],
                      ['Activities', it.estimatedCostBreakdown.activities, 'var(--ds-warning)'],
                      ['Transport', it.estimatedCostBreakdown.transport, '#ec4899'],
                    ] as [string, number, string][]).map(([label, amount, color]) => {
                      const pct = Math.round((amount / selectedTrip.budget) * 100);
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-xs font-bold mb-1.5">
                            <span className="opacity-70">{label}</span>
                            <span>${amount}</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-between pt-3 mt-2 border-t border-white/5 text-sm font-black">
                      <span>Total</span><span className="text-accent-primary">${selectedTrip.budget}</span>
                    </div>
                  </div>
                ) : <div className="skeleton h-28 w-full rounded-2xl" />}
              </div>

              {/* Weather */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2"><ThermometerSun size={14} /> Weather Forecast</p>
                {it ? (
                  <div className="grid grid-cols-5 gap-2">
                    {it.weather.map((w, i) => (
                      <div key={i} className="text-center p-2 rounded-xl bg-white/[0.03] border border-white/5">
                        <p className="text-[9px] font-black opacity-40 mb-1.5">{w.day}</p>
                        <div className="flex justify-center text-accent-amber mb-1.5">{weatherIcon(w.condition)}</div>
                        <p className="font-black text-xs">{w.temp.high}°</p>
                      </div>
                    ))}
                  </div>
                ) : <div className="skeleton h-16 w-full rounded-2xl" />}
              </div>

              {/* Packing list */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2"><Backpack size={14} /> Smart Packing List</p>
                <ul className="space-y-2">
                  {packingList.map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm">
                      <div className="w-4 h-4 rounded border border-white/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={12} className="text-accent-secondary opacity-0" />
                      </div>
                      <span className="opacity-70">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                <ShieldCheck size={18} className="text-accent-secondary flex-shrink-0" />
                <p className="text-xs opacity-60 leading-relaxed">Decisions before booking — INDOTRAVI never sells flights or hotels.</p>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* New Trip Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box glass-premium p-8 md:p-12 bg-[#0d1526] border-white/5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center text-white"><Sparkles size={24} /></div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black outfit tracking-tight">AI Assistant</h2>
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Setup Your Smart Journey</p>
              </div>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleCreateTrip({
                destination: formData.get('destination') as string,
                budget: Number(formData.get('budget')),
                days: Number(formData.get('days')),
                travelStyle: formData.get('travelStyle') as TravelStyle,
                preferences: [],
              });
            }} className="space-y-5">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-white/30 ml-2">Where to explore?</p>
                <input required name="destination" placeholder="Bali, Ubud, Bromo..." className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-white/30 ml-2">Duration (Days)</p>
                  <input required name="days" type="number" min={1} max={10} placeholder="5" className="input-field" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-white/30 ml-2">Budget ($)</p>
                  <input required name="budget" type="number" placeholder="2500" className="input-field" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-white/30 ml-2">Travel Style</p>
                <select name="travelStyle" className="input-field bg-[#050810]">
                  <option value="adventure">Adventure</option>
                  <option value="luxury">Luxury</option>
                  <option value="cultural">Cultural</option>
                  <option value="relaxation">Relaxation</option>
                  <option value="foodie">Foodie</option>
                  <option value="budget">Budget</option>
                </select>
              </div>
              <div className="flex gap-4 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-white/30 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="bg-white text-black font-black flex-1 py-4 rounded-2xl hover:scale-105 transition-all">Generate Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast bg-black text-white px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-3 border border-white/10">
        <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></div>{toast}
      </div>}
    </div>
  );
}
