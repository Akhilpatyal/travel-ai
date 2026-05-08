'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Calendar, MapPin, DollarSign, Sparkles, Clock, ChevronRight, X, 
  Loader2, Plane, Utensils, Activity, Info, Sun, Cloud, CloudRain, Snowflake, 
  CloudLightning, Users, UserPlus, MessageSquare, Brain, Heart, Navigation, 
  Search, Star, Globe, Car, Building, ChevronDown, CheckCircle, ArrowRight, Zap, Target
} from 'lucide-react';
import { Trip, TripFormData, TravelStyle } from './types/trip';
import { tripStore } from './lib/tripStore';
import { generateItinerary, analyzeGroupPreferences } from './lib/aiEngine';

// --- Assets ---
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1920&q=80',
];

const BEST_LOCATIONS = [
  { name: 'Bromo, East Java', desc: 'Bromo Tengger Tour', img: 'https://images.unsplash.com/photo-1505993597083-3bd19fb75e57?auto=format&fit=crop&w=800&q=80' },
  { name: 'Denpasar, Bali', desc: 'Bali Beach Tourism', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80' },
  { name: 'Ubud, Bali', desc: 'Cultural Heritage', img: 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=800&q=80' },
  { name: 'Borobudur, Magelang', desc: 'Ancient Temple Tour', img: 'https://images.unsplash.com/photo-1596402184320-417d717867cd?auto=format&fit=crop&w=800&q=80' },
];

const PACKAGES = [
  { name: 'Bali Tour Package', price: '$285', days: '7 Days', rating: 4.8, img: 'https://images.unsplash.com/photo-1537953391402-f89a2e3ce301?auto=format&fit=crop&w=600&q=80' },
  { name: 'Java Tour Package', price: '$218', days: '5 Days', rating: 4.9, img: 'https://images.unsplash.com/photo-1505993597083-3bd19fb75e57?auto=format&fit=crop&w=600&q=80' },
  { name: 'Solo Tour Package', price: '$163', days: '3 Days', rating: 4.7, img: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&w=600&q=80' },
];

// --- Sub-Components ---

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {HERO_IMAGES.map((img, i) => (
        <div 
          key={i}
          className="hero-slide"
          style={{ 
            backgroundImage: `url(${img})`,
            opacity: current === i ? 1 : 0,
            zIndex: current === i ? 1 : 0
          }}
        >
          <div className="hero-overlay"></div>
        </div>
      ))}
      <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {HERO_IMAGES.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 rounded-full transition-all duration-500 ${current === i ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default function TravelAI() {
  const [view, setView] = useState<'landing' | 'app' | 'discovery'>('landing');
  const [discoveryItem, setDiscoveryItem] = useState<any>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'budget' | 'group'>('overview');
  const [toast, setToast] = useState<string | null>(null);

  // New Search Planning State
  const [plannerData, setPlannerData] = useState({ destination: '', days: '', budget: '', style: 'adventure' as TravelStyle });

  useEffect(() => {
    setTrips(tripStore.getAll());
    const unsubscribe = tripStore.subscribe(setTrips);
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleCreateTrip = async (data: TripFormData) => {
    const newTrip = tripStore.create(data);
    setIsModalOpen(false);
    showToast(`AI Trip Initialized!`);
    tripStore.update(newTrip.id, { isGenerating: true });
    try {
      const itinerary = await generateItinerary(data);
      tripStore.update(newTrip.id, { itinerary, isGenerating: false });
      showToast(`Smart Itinerary ready!`);
    } catch (err) { tripStore.update(newTrip.id, { isGenerating: false }); showToast("AI Engine Error."); }
  };

  const handleAISearch = () => {
    if (!plannerData.destination) { showToast("Enter a destination first!"); return; }
    setView('app');
    handleCreateTrip({
      destination: plannerData.destination,
      days: Number(plannerData.days) || 3,
      budget: Number(plannerData.budget) || 1000,
      travelStyle: plannerData.style,
      preferences: []
    });
  };

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-white text-black font-sans selection:bg-accent-primary selection:text-white">
        {/* Transparent Navbar */}
        <nav className="absolute top-0 left-0 right-0 z-50 py-8 px-12 flex items-center justify-between">
          <div className="text-3xl font-black outfit tracking-tighter text-white flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Navigation size={24} className="text-black" />
            </div>
            INDOTRAVI
          </div>
          <div className="nav-pill hidden lg:flex bg-white/10 backdrop-blur-md border-white/20">
            <a href="#" className="nav-link">Explore</a>
            <a href="#" className="nav-link">Packages</a>
            <a href="#" className="nav-link">Community</a>
            <a href="#" className="nav-link">About</a>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setView('app')} className="px-10 py-3 bg-white text-black font-extrabold rounded-full text-sm hover:scale-105 transition-all shadow-xl">
              Launch AI Assistant
            </button>
          </div>
        </nav>

        {/* Hero Slider Section */}
        <section className="relative h-[100vh] flex flex-col items-center justify-center text-center px-6 pt-20">
          <HeroSlider />
          
          <div className="relative z-10 max-w-5xl animate-slideUp">
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 mb-8">
                <Sparkles size={16} className="text-accent-amber" />
                <span className="text-xs font-bold uppercase tracking-widest text-white">Smart Journey Generator</span>
             </div>
             <h1 className="text-6xl md:text-9xl font-black mb-8 leading-[0.9] outfit tracking-tighter text-white">
                AI TRAVEL<br /><span className="opacity-50">REIMAGINED</span>
             </h1>
             <p className="text-xl md:text-2xl text-white/70 mb-16 max-w-2xl mx-auto font-medium leading-relaxed">
                Experience real-time adaptive planning. Our AI Assistant curates your legacy travel moments in seconds.
             </p>

             {/* Redesigned AI Search Planner (Horizontal modern layout) */}
             <div className="ai-search-container max-w-6xl mx-auto flex flex-col md:flex-row items-stretch gap-2 mb-12">
                <div className="ai-input-group">
                   <p className="ai-label">Step 1: Destination</p>
                   <input 
                      placeholder="Where to?" 
                      className="ai-input"
                      value={plannerData.destination}
                      onChange={(e) => setPlannerData({ ...plannerData, destination: e.target.value })}
                   />
                </div>
                <div className="ai-input-group">
                   <p className="ai-label">Step 2: Style</p>
                   <select 
                      className="ai-input appearance-none cursor-pointer"
                      value={plannerData.style}
                      onChange={(e) => setPlannerData({ ...plannerData, style: e.target.value as TravelStyle })}
                   >
                      <option value="adventure">Adventure</option>
                      <option value="luxury">Luxury</option>
                      <option value="cultural">Cultural</option>
                      <option value="relaxation">Relaxation</option>
                   </select>
                </div>
                <div className="ai-input-group">
                   <p className="ai-label">Budget Range</p>
                   <input 
                      placeholder="$1000" 
                      type="number"
                      className="ai-input"
                      value={plannerData.budget}
                      onChange={(e) => setPlannerData({ ...plannerData, budget: e.target.value })}
                   />
                </div>
                <button 
                   onClick={handleAISearch}
                   className="px-12 py-4 bg-white text-black font-black rounded-[30px] hover:bg-accent-primary hover:text-white transition-all duration-500 flex items-center justify-center gap-3"
                >
                   <Brain size={20} />
                   Generate AI Plan
                </button>
             </div>

             {/* Step Progress Visual Guide */}
             <div className="flex items-center justify-center gap-4 text-white/40 text-xs font-bold uppercase tracking-widest max-w-sm mx-auto">
                <span className={plannerData.destination ? "text-white" : ""}>Destination</span>
                <div className="w-12 h-[1px] bg-white/20"></div>
                <span className={plannerData.style ? "text-white" : ""}>Style</span>
                <div className="w-12 h-[1px] bg-white/20"></div>
                <span className="flex items-center gap-2">AI Plan <CheckCircle size={14} /></span>
             </div>
          </div>
        </section>

        {/* Trending Destinations Section */}
        <section className="py-32 px-12 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-1 bg-accent-primary rounded-full"></div>
                <p className="text-accent-primary font-bold uppercase tracking-widest text-xs">AI Personalized Picks</p>
              </div>
              <h2 className="text-5xl md:text-6xl font-black outfit leading-none mb-6">Explore Indonesian<br />Smart Tourism</h2>
              <p className="text-secondary text-lg">Curated by our Realtime Adaptive Planning engine to match the top-rated global travel standards.</p>
            </div>
            <button className="px-10 py-4 border-2 border-black font-black rounded-full hover:bg-black hover:text-white transition-all">Explore All Spots</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {BEST_LOCATIONS.map((loc, i) => (
              <div key={i} className={`relative rounded-[48px] overflow-hidden group cursor-pointer shadow-2xl transition-all duration-700 ${i === 0 || i === 3 ? 'md:col-span-2 aspect-[16/10]' : 'aspect-[10/13]'}`}>
                <img src={loc.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" alt={loc.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                <div className="absolute bottom-10 left-10 right-10 transform group-hover:-translate-y-2 transition-all duration-500">
                  <div className="flex items-center gap-2 text-white/70 text-xs font-bold uppercase tracking-widest mb-3">
                    <MapPin size={16} className="text-accent-amber" />
                    {loc.name}
                  </div>
                  <h4 className="text-3xl font-black text-white outfit leading-tight">{loc.desc}</h4>
                </div>
                <div className="absolute top-8 right-8 w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  <Zap size={24} className="text-white fill-white" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it Works - Micro Animations Pass */}
        <section className="py-32 px-12 bg-[#050810] text-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
               <div className="relative">
                  <div className="absolute -inset-10 bg-accent-primary/20 blur-[100px] rounded-full"></div>
                  <div className="relative rounded-[60px] overflow-hidden aspect-square shadow-2xl border border-white/5">
                    <img src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1000&q=80" className="w-full h-full object-cover" alt="AI Planner" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent-primary/40 to-transparent"></div>
                    <div className="absolute top-10 left-10 right-10 glass-premium p-6 rounded-3xl animate-pulse">
                       <div className="flex items-center gap-4 mb-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                          <span className="text-[10px] font-bold uppercase tracking-widest">AI Engine Processing...</span>
                       </div>
                       <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white w-2/3"></div>
                       </div>
                    </div>
                  </div>
               </div>
               <div>
                  <h2 className="text-6xl font-black outfit mb-16 leading-tight">Personalized AI<br />Itinerary in 1-Click</h2>
                  <div className="space-y-12">
                    {[
                      { icon: <Target />, title: 'Set Your Vibes', desc: 'Define your budget and travel style. Our AI starts learning your preferences instantly.' },
                      { icon: <Brain />, title: 'Smart Generation', desc: 'Millions of data points analyzed to create the perfect flow for your journey.' },
                      { icon: <Globe />, title: 'Realtime Adaptation', desc: 'Itinerary adjusts based on weather, group changes, and local events.' }
                    ].map((step, i) => (
                      <div key={i} className="flex gap-8 group">
                        <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-all duration-500">
                          {step.icon}
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold mb-3">{step.title}</h4>
                          <p className="text-white/50 leading-relaxed text-lg">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Footer Refinement */}
        <footer className="bg-white text-black py-32 px-12 border-t border-gray-100">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-20">
             <div className="max-w-sm">
                <h3 className="text-4xl font-black outfit mb-8 tracking-tighter">INDOTRAVI<span className="text-accent-primary">.AI</span></h3>
                <p className="text-gray-500 text-lg leading-relaxed mb-10">Next-generation travel intelligence for the modern explorer. Experience the archipelago reimagined by AI.</p>
                <div className="flex gap-4">
                   <div className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all cursor-pointer"><Globe size={20} /></div>
                   <div className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all cursor-pointer"><Heart size={20} /></div>
                   <div className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all cursor-pointer"><MessageSquare size={20} /></div>
                </div>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-20">
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
           <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></div>
           {toast}
        </div>}
      </div>
    );
  }

  // --- AI Planning Engine View (Keep as functional dashboard) ---
  return (
    <div className="min-h-screen bg-[#050810] text-white p-8 selection:bg-accent-primary">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <button 
             onClick={() => setView('landing')} 
             className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <ChevronRight size={24} className="rotate-180" />
          </button>
          <div>
            <h1 className="text-3xl font-black outfit tracking-tight flex items-center gap-2">
               TravelAI <span className="text-accent-primary uppercase text-xs px-2 py-1 bg-accent-primary/10 rounded">Smart Engine</span>
            </h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Realtime Adaptive Planning Active</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-glow py-4 px-10 flex items-center gap-3">
           <Plus size={20} /> New Expedition
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-7xl mx-auto h-[70vh]">
        <div className="lg:col-span-4 glass-premium p-8 overflow-y-auto hide-scrollbar border-white/5 bg-white/[0.02]">
           <p className="text-xs font-black uppercase tracking-widest text-white/30 mb-8">Your Managed Trips</p>
           {trips.length === 0 ? (
             <div className="text-center py-20 opacity-20">No active plans</div>
           ) : trips.map(trip => (
             <div 
                key={trip.id} 
                onClick={() => setSelectedTrip(trip)} 
                className={`p-6 rounded-3xl cursor-pointer mb-4 border transition-all ${selectedTrip?.id === trip.id ? 'bg-accent-primary border-accent-primary text-white shadow-2xl' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
             >
                <div className="flex justify-between items-start">
                   <h3 className="font-bold text-lg capitalize">{trip.destination}</h3>
                   {trip.isGenerating && <Loader2 size={16} className="animate-spin opacity-40" />}
                </div>
                <p className="text-[10px] uppercase font-bold opacity-60 mt-3">{trip.days} Days • ${trip.budget}</p>
             </div>
           ))}
        </div>
        <div className="lg:col-span-8 flex flex-col">
           {!selectedTrip ? (
             <div className="flex-1 glass-premium flex flex-col items-center justify-center border-white/5">
                <Brain size={64} className="text-accent-primary opacity-20 mb-6 animate-pulse" />
                <h3 className="text-2xl font-bold">Select an active journey</h3>
                <p className="text-white/30 max-w-xs text-center mt-2">Initialize your expedition from the sidebar or landing page.</p>
             </div>
           ) : (
             <div className="flex-1 glass-premium p-10 border-white/5 animate-fadeIn">
                <div className="flex justify-between items-start mb-10">
                   <div>
                      <div className="px-3 py-1 bg-accent-primary/10 text-accent-primary rounded-full text-[10px] font-black uppercase mb-4 inline-block tracking-widest">Active Itinerary</div>
                      <h2 className="text-5xl font-black capitalize tracking-tighter">{selectedTrip.destination}</h2>
                   </div>
                   <div className="text-right">
                      <p className="text-4xl font-black text-accent-primary">${selectedTrip.budget}</p>
                      <p className="text-[10px] uppercase font-black opacity-30 mt-1">Managed Funds</p>
                   </div>
                </div>
                
                <div className="flex gap-8 border-b border-white/5 mb-10">
                   {['overview', 'itinerary', 'budget', 'group'].map(t => (
                     <button 
                        key={t} 
                        onClick={() => setActiveTab(t as any)} 
                        className={`pb-4 text-sm font-black uppercase tracking-widest transition-all ${activeTab === t ? 'text-white border-b-2 border-white' : 'text-white/30 hover:text-white'}`}
                     >
                        {t}
                     </button>
                   ))}
                </div>

                <div className="flex-1 overflow-y-auto hide-scrollbar">
                   {activeTab === 'overview' && (
                      <div className="grid grid-cols-2 gap-6">
                         <div className="p-6 bg-white/5 rounded-[32px]">
                            <h4 className="font-bold mb-4 flex items-center gap-2"><Sun size={18} /> Daily Forecast</h4>
                            <div className="flex gap-4">
                               {selectedTrip.itinerary?.weather.map((w, i) => (
                                 <div key={i} className="text-center">
                                    <p className="text-[8px] font-black opacity-40 mb-1">{w.day}</p>
                                    <div className="mb-1 text-accent-amber">{w.condition === 'sunny' ? <Sun size={16} /> : <Cloud size={16} />}</div>
                                    <p className="font-black text-xs">{w.temp.high}°</p>
                                 </div>
                               ))}
                            </div>
                         </div>
                         <div className="p-6 bg-white/5 rounded-[32px]">
                            <h4 className="font-bold mb-4 flex items-center gap-2"><DollarSign size={18} /> Budget Pulse</h4>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                               <div className="h-full bg-accent-primary" style={{ width: '60%' }}></div>
                            </div>
                            <p className="text-[10px] font-bold mt-4 opacity-40">60% UTILIZED</p>
                         </div>
                      </div>
                   )}
                   {activeTab === 'itinerary' && (
                      <div className="space-y-4">
                         {selectedTrip.itinerary?.dayPlans.map(day => (
                            <div key={day.day} className="p-6 bg-white/5 rounded-[32px] border border-white/5">
                               <div className="flex items-center gap-4 mb-4">
                                  <div className="w-8 h-8 rounded-xl bg-accent-primary text-white flex items-center justify-center font-black text-sm">{day.day}</div>
                                  <h4 className="text-lg font-bold">{day.theme}</h4>
                               </div>
                               <p className="text-white/50 text-sm leading-relaxed">{day.morning}</p>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>
           )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box glass-premium p-12 bg-[#0d1526] border-white/5">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center text-white"><Sparkles size={24} /></div>
               <div>
                  <h2 className="text-3xl font-black outfit tracking-tight">AI Assistant</h2>
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
            }} className="space-y-6">
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase text-white/30 ml-2">Where to explore?</p>
                 <input required name="destination" placeholder="Bali, Kyoto, Paris..." className="input-field py-4" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase text-white/30 ml-2">Duration (Days)</p>
                   <input required name="days" type="number" placeholder="5" className="input-field py-4" />
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase text-white/30 ml-2">Budget Allocation ($)</p>
                   <input required name="budget" type="number" placeholder="2500" className="input-field py-4" />
                </div>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase text-white/30 ml-2">Travel Style</p>
                 <select name="travelStyle" className="input-field py-4 bg-[#050810]">
                   <option value="adventure">Adventure</option>
                   <option value="luxury">Luxury</option>
                   <option value="cultural">Cultural</option>
                   <option value="relaxation">Relaxation</option>
                 </select>
              </div>
              <div className="flex gap-6 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-white/30 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="bg-white text-black font-black flex-1 py-4 rounded-2xl hover:scale-105 transition-all">Generate Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
