export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface FloodData {
  summary: string;
  groundingChunks: GroundingChunk[];
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  sources?: GroundingChunk[];
}

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

// Updated Status Types
export type RequestStatus = 'pending' | 'in_progress' | 'assigned' | 'completed' | 'cancelled';

export interface PeopleBreakdown {
  adults: number;
  children: number;
  elderly: number;
}

export interface PetDetails {
  dogs: number;
  cats: number;
  others: string;
}

export interface HelpRequest {
  id: string;
  name: string;
  phone: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  urgency: UrgencyLevel;
  people: PeopleBreakdown;
  medicalNeeds: number; // Subset of total people who are sick/disabled
  pets: PetDetails;
  details: string;
  timestamp: Date;
  status: RequestStatus;
}