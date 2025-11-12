import axios, { AxiosError } from "axios";
import { type ApiError } from "../types/authTypes";
import {
  type AuthResponse,
  type SigninRequest,
  type SignupRequest,
} from "../types/usersTypes";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5550/api";

export const signupUser = async (
  userData: SignupRequest
): Promise<AuthResponse> => {
  try {
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}/users/signup`,
      userData
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError<ApiError>;
    throw (
      err.response?.data || {
        message: "Signup failed",
        status: err.response?.status,
      }
    );
  }
};

export const signinUser = async (
  credentials: SigninRequest
): Promise<AuthResponse> => {
  try {
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}/users/signin`,
      credentials
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError<ApiError>;
    throw (
      err.response?.data || {
        message: "Signin failed",
        status: err.response?.status,
      }
    );
  }
};
