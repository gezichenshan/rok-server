export interface Location {
  id: string;
  kindom: string;
  lost: string;
  x: string;
  y: string;
  type: string;
  password: string;
  handled: boolean;
  created_at: string;
  address?: string;
}

export interface User {
  kindom: string;
  password: string;
}
