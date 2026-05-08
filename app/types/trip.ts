export type TravelStyle = 'adventure' | 'cultural' | 'relaxation' | 'foodie' | 'budget' | 'luxury';

export interface DayPlan {
  day: number;
  theme: string;
  morning: string;
  afternoon: string;
  evening: string;
  food: string;
}

export interface Member {
  id: string;
  name: string;
  avatarColor: string;
  preference: string;
  budgetPreference: 'low' | 'medium' | 'high';
}

export interface Suggestion {
  id: string;
  type: 'activity' | 'food' | 'destination' | 'note';
  content: string;
  suggestedBy: string; // member id
  votes: number;
}

export interface WeatherForecast {
  day: string;
  temp: { high: number; low: number };
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy';
  description: string;
}

export interface AIItinerary {
  places: string[];
  activities: string[];
  foodRecommendations: string[];
  dayPlans: DayPlan[];
  tips: string[];
  weather: WeatherForecast[];
  estimatedCostBreakdown: {
    accommodation: number;
    food: number;
    activities: number;
    transport: number;
  };
}

export interface Expense {
  id: string;
  amount: number;
  category: 'food' | 'transport' | 'accommodation' | 'activities' | 'others';
  description: string;
  date: number;
}

export interface Trip {
  id: string;
  destination: string;
  budget: number;
  days: number;
  travelStyle: TravelStyle;
  preferences: string[];
  createdAt: number;
  updatedAt: number;
  status: 'planning' | 'confirmed' | 'completed';
  itinerary?: AIItinerary;
  isGenerating?: boolean;
  expenses: Expense[];
  members: Member[];
  suggestions: Suggestion[];
}

export interface TripFormData {
  destination: string;
  budget: number;
  days: number;
  travelStyle: TravelStyle;
  preferences: string[];
}
