export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  ownerId: string;
  collaborators: string[];
  isPublic?: boolean;
  createdAt: string;
  aiInsights?: string;
  coverPhotoUrl?: string;
}

export interface ItineraryItem {
  id: string;
  tripId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  type: 'flight' | 'hotel' | 'activity' | 'restaurant' | 'transport';
}

export interface Booking {
  id: string;
  userId: string;
  attractionId: string;
  attractionName: string;
  travelDate: string;
  numberOfPeople: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paymentMethod?: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  coverImage?: string;
  category: 'news' | 'story' | 'culture' | 'guide';
  tags: string[];
  createdAt: string;
  isPublished: boolean;
}

export type Language = 'en' | 'aa' | 'am';
