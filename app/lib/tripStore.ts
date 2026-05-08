'use client';

import { Trip, TripFormData, Expense, Member, Suggestion } from '../types/trip';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'travelai_trips';

function loadTrips(): Trip[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTrips(trips: Trip[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

// Listeners for real-time updates (pub/sub within same tab)
type Listener = (trips: Trip[]) => void;
const listeners = new Set<Listener>();

function notify(trips: Trip[]) {
  listeners.forEach(fn => fn(trips));
}

export const tripStore = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  getAll(): Trip[] {
    return loadTrips();
  },

  create(data: TripFormData): Trip {
    const trips = loadTrips();
    const trip: Trip = {
      ...data,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'planning',
      isGenerating: false,
      expenses: [],
      members: [],
      suggestions: [],
    };
    const updated = [trip, ...trips];
    saveTrips(updated);
    notify(updated);
    return trip;
  },

  update(id: string, changes: Partial<Trip>): Trip | null {
    const trips = loadTrips();
    const idx = trips.findIndex(t => t.id === id);
    if (idx === -1) return null;
    trips[idx] = { ...trips[idx], ...changes, updatedAt: Date.now() };
    saveTrips(trips);
    notify([...trips]);
    return trips[idx];
  },

  delete(id: string): void {
    const trips = loadTrips().filter(t => t.id !== id);
    saveTrips(trips);
    notify(trips);
  },

  getById(id: string): Trip | undefined {
    return loadTrips().find(t => t.id === id);
  },

  addExpense(tripId: string, amount: number, category: Expense['category'], description: string) {
    const trips = loadTrips();
    const tripIdx = trips.findIndex(t => t.id === tripId);
    if (tripIdx === -1) return;

    const newExpense: Expense = {
      id: uuidv4(),
      amount,
      category,
      description,
      date: Date.now(),
    };

    trips[tripIdx].expenses.push(newExpense);
    trips[tripIdx].updatedAt = Date.now();
    saveTrips(trips);
    notify([...trips]);
  },

  deleteExpense(tripId: string, expenseId: string) {
    const trips = loadTrips();
    const tripIdx = trips.findIndex(t => t.id === tripId);
    if (tripIdx === -1) return;

    trips[tripIdx].expenses = trips[tripIdx].expenses.filter(e => e.id !== expenseId);
    trips[tripIdx].updatedAt = Date.now();
    saveTrips(trips);
    notify([...trips]);
  },

  addMember(tripId: string, name: string, preference: string, budgetPreference: Member['budgetPreference']) {
    const trips = loadTrips();
    const tripIdx = trips.findIndex(t => t.id === tripId);
    if (tripIdx === -1) return;

    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
    const newMember: Member = {
      id: uuidv4(),
      name,
      preference,
      budgetPreference,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    };

    trips[tripIdx].members.push(newMember);
    saveTrips(trips);
    notify([...trips]);
  },

  addSuggestion(tripId: string, type: Suggestion['type'], content: string, memberId: string) {
    const trips = loadTrips();
    const tripIdx = trips.findIndex(t => t.id === tripId);
    if (tripIdx === -1) return;

    const newSuggestion: Suggestion = {
      id: uuidv4(),
      type,
      content,
      suggestedBy: memberId,
      votes: 0,
    };

    trips[tripIdx].suggestions.push(newSuggestion);
    saveTrips(trips);
    notify([...trips]);
  },
};
