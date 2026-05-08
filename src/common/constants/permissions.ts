export const FEATURES = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_ANALYTICS: 'view_analytics',

  VIEW_BOOKINGS: 'view_bookings',
  MANAGE_BOOKINGS: 'manage_bookings',

  VIEW_SERVICES: 'view_services',
  MANAGE_SERVICES: 'manage_services',

  VIEW_CONTACTS: 'view_contacts',
  MANAGE_CONTACTS: 'manage_contacts',

  VIEW_PROVIDERS: 'view_providers',
  MANAGE_PROVIDERS: 'manage_providers',

  VIEW_CALENDAR: 'view_calendar',

  VIEW_SETTINGS: 'view_settings',
  MANAGE_TEAM: 'manage_team',
  MANAGE_BUSINESS: 'manage_business',
} as const;

export type FeatureCode = (typeof FEATURES)[keyof typeof FEATURES];

export const ALL_FEATURES: FeatureCode[] = Object.values(FEATURES);

export const FEATURE_DESCRIPTIONS: Record<
  FeatureCode,
  { label: string; description: string }
> = {
  [FEATURES.VIEW_DASHBOARD]: {
    label: 'View Dashboard',
    description: 'Can see the main dashboard',
  },
  [FEATURES.VIEW_ANALYTICS]: {
    label: 'View Analytics',
    description: 'Can see analytics and reports',
  },

  [FEATURES.VIEW_BOOKINGS]: {
    label: 'View Bookings',
    description: 'Can see the bookings list',
  },
  [FEATURES.MANAGE_BOOKINGS]: {
    label: 'Manage Bookings',
    description: 'Can create, edit, or cancel bookings',
  },

  [FEATURES.VIEW_SERVICES]: {
    label: 'View Services',
    description: 'Can see the services list',
  },
  [FEATURES.MANAGE_SERVICES]: {
    label: 'Manage Services',
    description: 'Can create, edit, or delete services',
  },

  [FEATURES.VIEW_CONTACTS]: {
    label: 'View Contacts',
    description: 'Can see customer contacts',
  },
  [FEATURES.MANAGE_CONTACTS]: {
    label: 'Manage Contacts',
    description: 'Can create, edit, or delete contacts',
  },

  [FEATURES.VIEW_PROVIDERS]: {
    label: 'View Providers',
    description: 'Can see service providers',
  },
  [FEATURES.MANAGE_PROVIDERS]: {
    label: 'Manage Providers',
    description: 'Can create, edit, or remove providers',
  },

  [FEATURES.VIEW_CALENDAR]: {
    label: 'View Calendar',
    description: 'Can see the calendar view',
  },

  [FEATURES.VIEW_SETTINGS]: {
    label: 'View Settings',
    description: 'Can see business settings',
  },
  [FEATURES.MANAGE_TEAM]: {
    label: 'Manage Team',
    description: 'Can add, edit, or remove team members and their permissions',
  },
  [FEATURES.MANAGE_BUSINESS]: {
    label: 'Manage Business',
    description: 'Can edit the business profile',
  },
};

export const DEFAULT_PERMISSIONS: Record<string, FeatureCode[]> = {
  Business_owner: ALL_FEATURES,
  Service_Provider: [
    FEATURES.VIEW_DASHBOARD,
    FEATURES.VIEW_BOOKINGS,
    FEATURES.VIEW_CALENDAR,
    FEATURES.VIEW_SERVICES,
    FEATURES.VIEW_CONTACTS,
  ],
};

export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'Super_Admin',
  BUSINESS_OWNER: 'Business_owner',
  SERVICE_PROVIDER: 'Service_Provider',
  CUSTOMER: 'Customer',
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
export const ALL_SYSTEM_ROLES: SystemRole[] = Object.values(SYSTEM_ROLES);
