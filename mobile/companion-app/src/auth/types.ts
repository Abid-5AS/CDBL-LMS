export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department?: string;
  role?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricEnabled: boolean;
  lastAuthTime: number | null;
}

export interface BiometricCheckResult {
  isAvailable: boolean;
  biometryType: 'FaceID' | 'TouchID' | 'Fingerprint' | 'Iris' | null;
  isEnrolled: boolean;
}

export interface AuthError {
  code: string;
  message: string;
}
