export type RehearsalTask = {
  id: string;
  title: string;
  note?: string;
  dueDate?: Date;
  completed: boolean;
  eventId?: string;
};

export type RehearsalEvent = {
  id: string;
  name: string;
  date?: Date;
  location?: string;
};

export type PracticeTask = {
  id: string;
  title: string;
  note?: string;
  dueDate?: Date;
  completed: boolean;
  category?: string;
};

export type Gig = {
  id: string;
  title: string;
  date?: Date;
  venueName: string;
  address?: string;
  contact?: string;
  callTime?: Date;
  compensation?: string;
  notes?: string;
};
