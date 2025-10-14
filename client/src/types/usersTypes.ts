export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  organizationName: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationName: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: UserResponse;
}

// src/types/userTypes.ts
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationName: string;
  profiles: string[];
  numberOfReconciledProfiles: number;
  numberOfUnReconciledProfiles: number;
  createdAt?: string;
  updatedAt?: string;
  token?: string;
}
