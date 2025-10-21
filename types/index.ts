export interface Currency {
  id: string;
  code: string;
  name: string;
  flagUrl: string;
  buyRate: number;
  midRate: number;
  sellRate: number;
  order: number;
  updatedAt: Date;
}

export interface Media {
  id: string;
  type: 'youtube' | 'image' | 'video';
  url: string;
  isActive: boolean;
  createdAt: Date;
  updatedBy: string;
}

export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'editor';
  createdAt: Date;
  createdBy?: string;
}
