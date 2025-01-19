export interface DashboardStats {
  totalActivities: number;
  weeklyScore: number;
  monthlyScore: number;
  activeStreak: number;
}

export interface SafeUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupProgress {
  group: Group;
  members: {
    user: SafeUser;
    activityCount: number;
    weeklyScore: number;
  }[];
}

export interface Activity {
  id: string;
  userId: string;
  groupId: string | null;
  activityType: 'CAMINATA' | 'CORRER' | 'BICICLETA_FIJA' | 'GYM' | 'TAP_OUT' | 'PILATES' | 'MALOVA';
  duration: number;
  date: Date;
  createdAt: Date;
}

export interface ActivityWithUser extends Activity {
  user: SafeUser;
} 