

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
if (
  USER_POOL_ID &&
  CLIENT_ID &&
  !USER_POOL_ID.includes('example') &&
  !CLIENT_ID.includes('example')
) {
  userPool = new CognitoUserPool({
    UserPoolId: USER_POOL_ID,
    ClientId: CLIENT_ID,
  });
}

const STORAGE_KEYS = {
  USER: 'life_dashboard_user',
  TOKEN: 'life_dashboard_jwt',
  ACCOUNTS: 'life_dashboard_accounts',
  OAUTH_IN_PROGRESS: 'life_dashboard_oauth_in_progress',
};

const getStoredAccounts = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
  } catch {
    return [];
  }
};

const saveStoredAccounts = (accounts) => {
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashString = window.location.hash.startsWith('#')
          ? window.location.hash.substring(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hashString);

        
        const oauthError = searchParams.get('error') || hashParams.get('error');
        const oauthErrorDesc =
          searchParams.get('error_description') || hashParams.get('error_description');

        if (oauthError) {
          sessionStorage.removeItem(STORAGE_KEYS.OAUTH_IN_PROGRESS);
          clearSession();
          window.history.replaceState({}, document.title, window.location.pathname);
          setError(`Google sign-in was cancelled or failed: ${oauthErrorDesc || oauthError}`);
          return;
        }

        
        const wasOAuthInProgress = sessionStorage.getItem(STORAGE_KEYS.OAUTH_IN_PROGRESS);
        const idToken = hashParams.get('id_token') || searchParams.get('id_token');
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');

        
        if (wasOAuthInProgress && !idToken && !accessToken) {
          sessionStorage.removeItem(STORAGE_KEYS.OAUTH_IN_PROGRESS);
          clearSession();
          window.history.replaceState({}, document.title, window.location.pathname);
          setError('Google sign-in was not completed.');
          return;
        }

        
        if (idToken || accessToken) {
          sessionStorage.removeItem(STORAGE_KEYS.OAUTH_IN_PROGRESS);
          if (idToken) {
            try {
              const base64Url = idToken.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const payload = JSON.parse(window.atob(base64));
              const oauthUser = {
                userId: payload.sub || `google-${Date.now()}`,
                email: payload.email,
                name: payload.name || payload.email?.split('@')[0],
                avatarUrl: payload.picture || '',
                token: idToken,
                authProvider: 'Google',
              };
              saveSession(oauthUser, idToken);
              fetchRemoteProfile(oauthUser.userId);
              window.history.replaceState({}, document.title, window.location.pathname);
              return;
            } catch (e) {
              console.warn('Failed to parse OAuth id_token:', e);
              clearSession();
              setError('Failed to process Google sign-in response.');
              window.history.replaceState({}, document.title, window.location.pathname);
              return;
            }
          } else if (accessToken) {
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (res.ok) {
                const profile = await res.json();
                const oauthUser = {
                  userId: profile.sub || `google-${Date.now()}`,
                  email: profile.email,
                  name: profile.name || profile.email?.split('@')[0],
                  avatarUrl: profile.picture || '',
                  token: accessToken,
                  authProvider: 'Google',
                };
                saveSession(oauthUser, accessToken);
                fetchRemoteProfile(oauthUser.userId);
                window.history.replaceState({}, document.title, window.location.pathname);
                return;
              }
            } catch (e) {
              console.warn('Failed to fetch Google user profile from access_token:', e);
              clearSession();
              setError('Failed to verify Google account credentials.');
              window.history.replaceState({}, document.title, window.location.pathname);
              return;
            }
          }
        }

        
        const cachedUserStr = localStorage.getItem(STORAGE_KEYS.USER);
        const cachedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);

        if (cachedUserStr && cachedToken) {
          try {
            const parsedUser = JSON.parse(cachedUserStr);
            if (parsedUser && parsedUser.userId) {
              setUser({ ...parsedUser, token: cachedToken });
              fetchRemoteProfile(parsedUser.userId);
            } else {
              clearSession();
            }
          } catch {
            clearSession();
          }
        } else if (userPool) {
          const cognitoUser = userPool.getCurrentUser();
          if (cognitoUser) {
            cognitoUser.getSession((err, session) => {
              if (err || !session.isValid()) {
                clearSession();
              } else {
                const sessionToken = session.getIdToken().getJwtToken();
                const payload = session.getIdToken().decodePayload();
                const sessionUser = {
                  userId: payload.sub,
                  email: payload.email,
                  name: payload.name || payload.email.split('@')[0],
                  token: sessionToken,
                };
                saveSession(sessionUser, sessionToken);
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

    
    const handlePageShow = (event) => {
      if (event.persisted) {
        setLoading(false);
        const wasOAuth = sessionStorage.getItem(STORAGE_KEYS.OAUTH_IN_PROGRESS);
        if (wasOAuth) {
          sessionStorage.removeItem(STORAGE_KEYS.OAUTH_IN_PROGRESS);
          clearSession();
          setError('Google sign-in was not completed.');
          return;
        }

        const cachedUserStr = localStorage.getItem(STORAGE_KEYS.USER);
        const cachedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (cachedUserStr && cachedToken) {
          try {
            const parsed = JSON.parse(cachedUserStr);
            if (parsed?.userId) {
              setUser({ ...parsed, token: cachedToken });
            } else {
              clearSession();
            }
          } catch {
            clearSession();
          }
        } else {
          clearSession();
        }
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  
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
            defaultCurrency: res.profile.defaultCurrency || prev.defaultCurrency || 'INR',
          };
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err) {
      
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
    sessionStorage.removeItem(STORAGE_KEYS.OAUTH_IN_PROGRESS);
    if (userPool) {
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.signOut();
      }
    }
  };

  
  const login = async (email, password) => {
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setLoading(false);
      const err = new Error('Please enter both email and password.');
      setError(err.message);
      throw err;
    }

    
    if (!userPool) {
      const accounts = getStoredAccounts();
      const normalizedEmail = email.trim().toLowerCase();
      const matched = accounts.find((a) => a.email.toLowerCase() === normalizedEmail);

      if (!matched) {
        setLoading(false);
        const err = new Error(
          'No account found with this email. Please sign up or click Instant Demo Access.'
        );
        setError(err.message);
        throw err;
      }

      if (matched.password !== password) {
        setLoading(false);
        const err = new Error('Incorrect password. Please try again.');
        setError(err.message);
        throw err;
      }

      const sessionUser = {
        userId: matched.userId,
        email: matched.email,
        name: matched.name,
        avatarUrl: matched.avatarUrl || '',
        token: matched.token || `jwt-mock-${matched.userId}-${Date.now()}`,
        authProvider: 'Email',
      };
      saveSession(sessionUser, sessionUser.token);
      setLoading(false);
      return sessionUser;
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

  
  const signup = async (email, password, name) => {
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setLoading(false);
      const err = new Error('Please provide both email and password.');
      setError(err.message);
      throw err;
    }

    if (password.length < 6) {
      setLoading(false);
      const err = new Error('Password must be at least 6 characters.');
      setError(err.message);
      throw err;
    }

    
    if (!userPool) {
      const accounts = getStoredAccounts();
      const normalizedEmail = email.trim().toLowerCase();
      const existing = accounts.find((a) => a.email.toLowerCase() === normalizedEmail);

      if (existing) {
        setLoading(false);
        const err = new Error('An account with this email already exists. Please sign in instead.');
        setError(err.message);
        throw err;
      }

      const newAccount = {
        userId: `user-${Date.now()}`,
        email: normalizedEmail,
        password: password,
        name: name?.trim() || normalizedEmail.split('@')[0],
        token: `mock-jwt-token-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      accounts.push(newAccount);
      saveStoredAccounts(accounts);

      const sessionUser = {
        userId: newAccount.userId,
        email: newAccount.email,
        name: newAccount.name,
        token: newAccount.token,
        authProvider: 'Email',
      };
      saveSession(sessionUser, sessionUser.token);
      setLoading(false);
      return { isConfirmed: true, user: sessionUser };
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

  
  const forgotPassword = async (rawEmail) => {
    setError(null);
    const email = rawEmail?.trim();

    if (!email) {
      const err = new Error('Please enter your email address.');
      setError(err.message);
      throw err;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const err = new Error('Please enter a valid email address.');
      setError(err.message);
      throw err;
    }

    const normalizedEmail = email.toLowerCase();

    
    if (userPool) {
      return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({
          Username: normalizedEmail,
          Pool: userPool,
        });

        cognitoUser.forgotPassword({
          onSuccess: () => {
            resolve({
              success: true,
              message: 'Password reset email has been sent to your email.',
            });
          },
          onFailure: (err) => {
            let message = err.message || 'Failed to send password reset email.';
            if (err.code === 'UserNotFoundException') {
              message = 'No account found with this email. Please sign up as you are not a user.';
            }
            const errorObj = new Error(message);
            setError(errorObj.message);
            reject(errorObj);
          },
        });
      });
    }

    
    const accounts = getStoredAccounts();
    const userExists =
      accounts.some((a) => a.email.toLowerCase() === normalizedEmail) ||
      normalizedEmail === 'akshat@example.com';

    if (!userExists) {
      const err = new Error(
        'No account found with this email. Please sign up as you are not a user.'
      );
      setError(err.message);
      throw err;
    }

    return {
      success: true,
      message: 'Password reset email has been sent to your email.',
    };
  };

  
  const logout = () => {
    clearSession();
  };

  
  const updateProfile = async ({ name, avatarUrl, defaultCurrency }) => {
    if (!user) return null;

    
    try {
      await userApi.updateProfile({ name, avatarUrl, defaultCurrency });
    } catch (dbErr) {
      console.warn('Backend database profile update warning:', dbErr);
    }

    
    try {
      const accounts = getStoredAccounts();
      const idx = accounts.findIndex((a) => a.userId === user.userId || a.email === user.email);
      if (idx !== -1) {
        if (name !== undefined) accounts[idx].name = name;
        if (avatarUrl !== undefined) accounts[idx].avatarUrl = avatarUrl;
        if (defaultCurrency !== undefined) accounts[idx].defaultCurrency = defaultCurrency;
        saveStoredAccounts(accounts);
      }
    } catch {
      
    }

    
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

    
    const updatedUser = {
      ...user,
      ...(name !== undefined && { name }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(defaultCurrency !== undefined && { defaultCurrency }),
    };
    saveSession(updatedUser, updatedUser.token || localStorage.getItem(STORAGE_KEYS.TOKEN));
    return updatedUser;
  };

  
  const loginAsDemo = async () => {
    try {
      await login('demo@meridian.com', 'MeridianDemo123!');
      
      
      setUser(prev => {
        const updated = { ...prev, isDemo: true, authProvider: 'Demo' };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error('Demo login failed:', err);
      setError('Could not connect to the live AWS Demo environment.');
    }
  };

  
  const loginWithGoogle = () => {
    setError(null);
    clearSession();

    const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN || '';
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || `${window.location.origin}/`;

    
    if (COGNITO_DOMAIN && CLIENT_ID && !CLIENT_ID.includes('example')) {
      sessionStorage.setItem(STORAGE_KEYS.OAUTH_IN_PROGRESS, 'google');
      setLoading(true);
      const googleAuthUrl = `https://${COGNITO_DOMAIN}/oauth2/authorize?identity_provider=Google&client_id=${CLIENT_ID}&response_type=token&scope=email+openid+profile&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
      window.location.href = googleAuthUrl;
      return;
    }

    
    if (
      GOOGLE_CLIENT_ID &&
      !GOOGLE_CLIENT_ID.includes('demo') &&
      !GOOGLE_CLIENT_ID.includes('example')
    ) {
      sessionStorage.setItem(STORAGE_KEYS.OAUTH_IN_PROGRESS, 'google');
      setLoading(true);
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token%20id_token&scope=openid%20email%20profile&nonce=${Date.now()}&prompt=select_account`;
      window.location.href = googleAuthUrl;
      return;
    }

    
    setLoading(false);
    const err = new Error(
      'Sign in with Google is not configured yet. Please sign in or sign up with email, or use Instant Demo Access.'
    );
    setError(err.message);
    throw err;
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
        forgotPassword,
        logout,
        updateProfile,
        loginAsDemo,
        loginWithGoogle,
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
