export enum ServiceStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Archived = 'Archived',
}

export enum BookingStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Cancelled = 'Cancelled',
  Completed = 'Completed',
}

export enum ConfirmationMethod {
  Email = 'Email',
  SMS = 'SMS',
  Phone = 'Phone',
  None = 'None',
}

export enum BookingSource {
  Website = 'Website',
  Phone = 'Phone',
  WalkIn = 'WalkIn',
  Mobile = 'Mobile',
  CRM = 'CRM',
}
