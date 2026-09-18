/**
 * Cognito Authentication Hook & Context
 * Handles Sign Up, Confirmation, Sign In, Sign Out, Token Management, and Local Dev Fallback
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';
import { userApi } from '../api/client';

const AuthContext = createContext(null);

const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';

let userPool = null;
if (USER_POOL_ID && CLIENT_ID) {
  userPool = new CognitoUserPool({
    UserPoolId: USER_POOL_ID,
    ClientId: CLIENT_ID,
  });
}

const STORAGE_KEYS = {
  USER: 'life_dashboard_user',
  TOKEN: 'life_dashboard_jwt',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session from localStorage or active Cognito session on initial mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const cachedUserStr = localStorage.getItem(STORAGE_KEYS.USER);
        const cachedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);

        if (cachedUserStr && cachedToken) {
          const parsedUser = JSON.parse(cachedUserStr);
          setUser({ ...parsedUser, token: cachedToken });
          // Fetch latest authoritative profile from database in background
          fetchRemoteProfile(parsedUser.userId);
        } else if (userPool) {
          const cognitoUser = userPool.getCurrentUser();
          if (cognitoUser) {
            cognitoUser.getSession((err, session) => {
              if (err || !session.isValid()) {
                clearSession();
              } else {
                const idToken = session.getIdToken().getJwtToken();
                const payload = session.getIdToken().decodePayload();
                const sessionUser = {
                  userId: payload.sub,
                  email: payload.email,
                  name: payload.name || payload.email.split('@')[0],
                  token: idToken,
                };
                saveSession(sessionUser, idToken);
                fetchRemoteProfile(payload.sub);
              }
            });
          }
        }
      } catch (err) {
        console.warn('Failed to restore session:', err);
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Fetch isolated profile record from database for this user
  const fetchRemoteProfile = async (targetUserId) => {
    try {
      const res = await userApi.getProfile();
      if (res?.profile) {
        setUser((prev) => {
          if (!prev || (prev.userId && prev.userId !== targetUserId)) return prev;
          const merged = {
            ...prev,
            name: res.profile.name || prev.name,
            avatarUrl: res.profile.avatarUrl !== undefined ? res.profile.avatarUrl : prev.avatarUrl,
          };
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err) {
      // Backend may be offline or in-memory; ignore gracefully
    }
  };

  const saveSession = (userData, token) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  };

  const clearSession = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    if (userPool) {
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.signOut();
      }
    }
  };

  /**
   * Log In with Email and Password
   */
  const login = async (email, password) => {
    setError(null);
    setLoading(true);

    // Local / Demo Mode fallback if Cognito credentials are not yet supplied
    if (!userPool) {
      console.info('Cognito User Pool not configured. Using Demo Account mode.');
      const demoUser = {
        userId: 'demo-user-1',
        email: email || 'akshat@example.com',
        name: (email ? email.split('@')[0] : 'Akshat'),
        token: `mock-jwt-token-demo-user-1-${Date.now()}`,
      };
      saveSession(demoUser, demoUser.token);
      setLoading(false);
      return demoUser;
    }

    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          const idToken = result.getIdToken().getJwtToken();
          const payload = result.getIdToken().decodePayload();
          const authUser = {
            userId: payload.sub,
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            token: idToken,
          };
          saveSession(authUser, idToken);
          setLoading(false);
          resolve(authUser);
        },
        onFailure: (err) => {
          setLoading(false);
          setError(err.message || 'Login failed.');
          reject(err);
        },
      });
    });
  };

  /**
   * Sign Up with Email, Password, and Name
   */
  const signup = async (email, password, name) => {
    setError(null);
    setLoading(true);

    if (!userPool) {
      console.info('Cognito User Pool not configured. Simulating instant signup.');
      const demoUser = {
        userId: `user-${Date.now()}`,
        email,
        name: name || email.split('@')[0],
        token: `mock-jwt-token-${Date.now()}`,
      };
      saveSession(demoUser, demoUser.token);
      setLoading(false);
      return { isConfirmed: true, user: demoUser };
    }

    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
        new CognitoUserAttribute({ Name: 'name', Value: name }),
      ];

      userPool.signUp(email, password, attributeList, null, (err, result) => {
        setLoading(false);
        if (err) {
          setError(err.message || 'Sign up failed.');
          reject(err);
        } else {
          resolve({
            isConfirmed: result.userConfirmed,
            userSub: result.userSub,
          });
        }
      });
    });
  };

  /**
   * Confirm Sign Up with verification code sent to email
   */
  const confirmSignup = async (email, code) => {
    setError(null);
    setLoading(true);

    if (!userPool) {
      setLoading(false);
      return true;
    }

    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.confirmRegistration(code, true, (err, result) => {
        setLoading(false);
        if (err) {
          setError(err.message || 'Verification code failed.');
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };

  /**
   * Sign Out
   */
  const logout = () => {
    clearSession();
  };

  /**
   * Update Profile (Name, Avatar URL / PFP)
   * Strictly isolated per user: updates DynamoDB single-table record PK: USER#{userId}, SK: PROFILE
   */
  const updateProfile = async ({ name, avatarUrl }) => {
    if (!user) return null;

    // 1. Send update to database API (scoped strictly to this user's PK)
    try {
      await userApi.updateProfile({ name, avatarUrl });
    } catch (dbErr) {
      console.warn('Backend database profile update warning:', dbErr);
    }

    // 2. If user is authenticated via Cognito, sync attribute to Cognito User Pool as well
    if (userPool && name) {
      try {
        const cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) {
          cognitoUser.getSession((err, session) => {
            if (!err && session.isValid()) {
              cognitoUser.updateAttributes(
                [new CognitoUserAttribute({ Name: 'name', Value: name })],
                (attrErr) => {
                  if (attrErr) console.warn('Cognito attribute sync:', attrErr);
                }
              );
            }
          });
        }
      } catch (cognitoErr) {
        console.warn('Cognito attribute update warning:', cognitoErr);
      }
    }

    // 3. Update local user state and storage for this user
    const updatedUser = {
      ...user,
      ...(name !== undefined && { name }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    };
    saveSession(updatedUser, updatedUser.token || localStorage.getItem(STORAGE_KEYS.TOKEN));
    return updatedUser;
  };

  /**
   * Quick Demo Login
   */
  const loginAsDemo = () => {
    const demoUser = {
      userId: 'demo-user-1',
      email: 'akshat@example.com',
      name: 'Akshat Mohanty',
      token: 'demo-jwt-token-life-dashboard',
    };
    saveSession(demoUser, demoUser.token);
  };

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        loading,
        error,
        login,
        signup,
        confirmSignup,
        logout,
        updateProfile,
        loginAsDemo,
        isAuthenticated: Boolean(user),
      },
    },
    children
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
