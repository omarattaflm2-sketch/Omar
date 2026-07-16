export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
export type FireStatus = 'Active' | 'Controlled' | 'Extinguished';

export interface Wildfire {
  id: string;
  lat: number;
  lng: number;
  wilaya: string;
  commune: string;
  severity: Severity;
  status: FireStatus;
  description: string;
  imageUrl?: string;
  reporterId: string;
  reporterEmail: string;
  isVerified: boolean;
  burnedArea: number; // in hectares
  reportsCount: number;
  aiConfidence?: number;
  aiAnalysis?: string;
  dangerIndex: number; // 1-100
  createdAt: string;
  updatedAt: string;
  temperature?: number;
  windSpeed?: number;
  humidity?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'user' | 'moderator' | 'authority';
  displayName?: string;
}

export interface NotificationAlert {
  id: string;
  wilaya: string;
  title: string;
  message: string;
  createdAt: string;
}

export interface FireDangerData {
  wilaya: string;
  index: number; // 1-100
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High' | 'Extreme';
  temperature: number;
  humidity: number;
  windSpeed: number;
}

export type Language = 'ar' | 'fr' | 'en';
export type Theme = 'light' | 'dark';
