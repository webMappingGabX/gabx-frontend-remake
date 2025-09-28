import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../../api/axios';

// Type helper pour les erreurs Axios
type AxiosErrorResponse = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

// Types pour l'état d'authentification
export interface User {
  id: string;
  email: string;
  username?: string;
  role: 'DEFAULT' | 'EXPERT' | 'ADMIN' | 'TENANT';
  profession: string;
  status: string;
  locationCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string;
  refreshToken: string;
  
  // États spécifiques aux différentes opérations
  login: {
    isLoading: boolean;
    error: string | null;
  };
  register: {
    isLoading: boolean;
    error: string | null;
    success: boolean;
  };
  sendResetCode: {
    isLoading: boolean;
    error: string | null;
    success: boolean;
  };
  verifyCode: {
    isLoading: boolean;
    error: string | null;
    success: boolean;
    resetToken: string | null;
  };
  resetPassword: {
    isLoading: boolean;
    error: string | null;
    success: boolean;
  };
  verifyResource: {
    isLoading: boolean;
    error: string | null;
    success: boolean;
  };
  
  // États pour les données géographiques
  regions: null;
  depts: null;
  arronds: null;
  towns: null;

}

// État initial
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  accessToken: '',
  refreshToken: '',
  
  login: {
    isLoading: false,
    error: null,
  },
  register: {
    isLoading: false,
    error: null,
    success: false,
  },
  sendResetCode: {
    isLoading: false,
    error: null,
    success: false,
  },
  verifyCode: {
    isLoading: false,
    error: null,
    success: false,
    resetToken: null,
  },
  resetPassword: {
    isLoading: false,
    error: null,
    success: false,
  },
  verifyResource: {
    isLoading: false,
    error: null,
    success: false,
  },
  
  // États pour les données géographiques
  regions: null,
  depts: null,
  arronds: null,
  towns: null
};

// Actions asynchrones
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { identifier: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/login', credentials);
      localStorage.setItem("accessToken", response.data.access);
      localStorage.setItem("refreshToken", response.data.refresh);
      return response.data;
    } catch (error: unknown) {
      console.log("LOGIN ERROR     ", error);
      const axiosError = error as AxiosErrorResponse;
      return rejectWithValue(axiosError.response?.data?.message || 'Erreur de connexion au serveur');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: { email: string; password: string; profession: string, username?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/register', userData);
      //return { status: response.status, data: response.data };
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorResponse;
      return rejectWithValue(axiosError.response?.data?.message || 'Erreur d\'inscription au serveur');
    }
  }
);

export const sendResetCode = createAsyncThunk(
  'auth/sendResetCode',
  async (email: string, { rejectWithValue }) => {
    try {
      await axios.post('/auth/send-reset-code', { email });
      return { success: true };
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorResponse;
      return rejectWithValue(axiosError.response?.data?.message || 'Erreur d\'envoi du code au serveur');
    }
  }
);

export const verifyCode = createAsyncThunk(
  'auth/verifyCode',
  async (verificationData: { email: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/verify-code', verificationData);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorResponse;
      //return rejectWithValue(axiosError.response?.data?.message || 'Erreur de vérification du code au serveur');
      return rejectWithValue(axiosError.response?.data?.message || 'Code de réinitialisation incorrect');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (resetData: { email: string; code: string; newPassword: string }, { rejectWithValue }) => {
    try {
      await axios.post('/auth/reset-password', resetData);
      return { success: true };
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorResponse;
      return rejectWithValue(axiosError.response?.data?.message || 'Erreur de réinitialisation au serveur');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axios.post('/auth/logout');
      return { success: true };
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorResponse;
      return rejectWithValue(axiosError.response?.data?.message || 'Erreur de déconnexion au serveur');
    }
  }
);

export const verifyResource = createAsyncThunk(
  'auth/verifyResource',
  async (_, { rejectWithValue }) => {
    try {
      await axios.post('/auth/verify-resource');
      return { success: true };
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorResponse;
      return rejectWithValue(axiosError.response?.data?.message || 'Erreur de verification des resources');
    }
  }
);

// Thunk for regions
export const getRegions = createAsyncThunk(
  'auth/getRegions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/geo/regions');
      return response.data;
    } catch (error: unknown) {
      console.log("GET REGIONS ERROR", error)
      const axiosError = error as AxiosErrorResponse;
      return rejectWithValue(axiosError.response?.data?.message || 'Erreur de la recuperation des regions');
    }
  }
);

// Thunk for departments
export const getDepts = createAsyncThunk(
  'auth/getDepts',
  async ({ regionId, params = null }, { rejectWithValue }) => {
    try {
      console.log("REGION ID", regionId);
      const response = await axios.get('/geo/departments', { params: {
        regionId,
        ...params
      } });
      return response.data;
    } catch (error: unknown) {
      console.log("GET DEPTS ERROR", error)
      const axiosError = error as AxiosErrorResponse;
      return rejectWithValue(axiosError.response?.data?.message || 'Erreur de la recuperation des depts');
    }
  }
);

// Thunk for districts
export const getArronds = createAsyncThunk(
  'auth/getArronds',
  async ({ deptId, params = null }, { rejectWithValue }) => {
    try {
      const response = await axios.get('/geo/arrondissements', { params: {
        departmentId: deptId,
        ...params
      } });
      return response.data;
    } catch (error: unknown) {
      console.log("GET ARRONDS ERROR", error)
      const axiosError = error as AxiosErrorResponse;
      return rejectWithValue(axiosError.response?.data?.message || 'Erreur de la recuperation des arronds');
    }
  }
);

// Thunk for towns
export const getTowns = createAsyncThunk(
  'auth/getTowns',
  async ({ arrondId, params = null }, { rejectWithValue }) => {
    try {
      console.log("ARRONDISSEMENT ID", arrondId);
      const response = await axios.get('/geo/towns', { params: {
        arrondissementId: arrondId,
        ...params
      } });
      return response.data;
    } catch (error: unknown) {
      console.log("GET TOWNS ERROR", error)
      const axiosError = error as AxiosErrorResponse;
      return rejectWithValue(axiosError.response?.data?.message || 'Erreur de la recuperation des villes');
    }
  }
);

// Slice d'authentification
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Actions synchrones
    clearErrors: (state) => {
      state.error = null;
      state.login.error = null;
      state.register.error = null;
      state.sendResetCode.error = null;
      state.verifyCode.error = null;
      state.resetPassword.error = null;
    },
    
    clearSuccess: (state) => {
      state.register.success = false;
      state.sendResetCode.success = false;
      state.verifyCode.success = false;
      state.resetPassword.success = false;
    },
    
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.access;
      state.refreshToken = action.payload.refresh;
      state.isAuthenticated = !!action.payload;
    },
    
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    
    resetAuthState: () => {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.login.isLoading = true;
        state.login.error = null;
        state.isLoading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.login.isLoading = false;
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.login.isLoading = false;
        state.isLoading = false;
        state.login.error = action.payload as string;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.register.isLoading = true;
        state.register.error = null;
        state.register.success = false;
        state.isLoading = true;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.register.isLoading = false;
        state.isLoading = false;
        state.register.success = true;
        state.register.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.register.isLoading = false;
        state.isLoading = false;
        state.register.error = action.payload as string;
        state.error = action.payload as string;
      });

    // Send Reset Code
    builder
      .addCase(sendResetCode.pending, (state) => {
        state.sendResetCode.isLoading = true;
        state.sendResetCode.error = null;
        state.sendResetCode.success = false;
        state.isLoading = true;
      })
      .addCase(sendResetCode.fulfilled, (state) => {
        state.sendResetCode.isLoading = false;
        state.isLoading = false;
        state.sendResetCode.success = true;
        state.sendResetCode.error = null;
      })
      .addCase(sendResetCode.rejected, (state, action) => {
        state.sendResetCode.isLoading = false;
        state.isLoading = false;
        state.sendResetCode.error = action.payload as string;
        state.error = action.payload as string;
      });

    // Verify Code
    builder
      .addCase(verifyCode.pending, (state) => {
        state.verifyCode.isLoading = true;
        state.verifyCode.error = null;
        state.verifyCode.success = false;
        state.isLoading = true;
      })
      .addCase(verifyCode.fulfilled, (state, action) => {
        state.verifyCode.isLoading = false;
        state.isLoading = false;
        state.verifyCode.success = true;
        state.verifyCode.resetToken = action.payload.resetToken;
        state.verifyCode.error = null;
      })
      .addCase(verifyCode.rejected, (state, action) => {
        state.verifyCode.isLoading = false;
        state.isLoading = false;
        state.verifyCode.error = action.payload as string;
        state.error = action.payload as string;
      });

    // Reset Password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.resetPassword.isLoading = true;
        state.resetPassword.error = null;
        state.resetPassword.success = false;
        state.isLoading = true;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.resetPassword.isLoading = false;
        state.isLoading = false;
        state.resetPassword.success = true;
        state.resetPassword.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.resetPassword.isLoading = false;
        state.isLoading = false;
        state.resetPassword.error = action.payload as string;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // verify resource
    builder
      .addCase(verifyResource.pending, (state) => {
        state.verifyResource.isLoading = true;
        state.verifyResource.error = null;
        state.verifyResource.success = false;
        state.isLoading = true;
      })
      .addCase(verifyResource.fulfilled, (state) => {
        state.verifyResource.isLoading = false;
        state.isLoading = false;
        state.verifyResource.success = true;
        state.verifyResource.error = null;
      })
      .addCase(verifyResource.rejected, (state, action) => {
        state.verifyResource.isLoading = false;
        state.isLoading = false;
        state.verifyResource.error = action.payload as string;
        state.error = action.payload as string;
      });

      // Regions
      builder
        .addCase(getRegions.fulfilled, (state : AuthState, action) => {
          state.regions = action.payload.data;
        });

      // Departments
      builder
        .addCase(getDepts.fulfilled, (state, action) => {
          state.depts = action.payload.data;
        });

      // Arrondissements
      builder
        .addCase(getArronds.fulfilled, (state, action) => {
          state.arronds = action.payload.data;
        });

      // Towns
      builder
        .addCase(getTowns.fulfilled, (state, action) => {
          state.towns = action.payload.data;
        });  
  },
});

// Export des actions et du reducer
export const { 
  clearErrors, 
  clearSuccess, 
  setUser, 
  clearUser, 
  resetAuthState 
} = authSlice.actions;

export default authSlice.reducer;

// Sélecteurs
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectTokens = (state: { auth: AuthState }) => ({
  access: state.auth.accessToken,
  refresh: state.auth.refreshToken,
});
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth?.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth?.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth?.error;
export const selectAuthUser = (state: { auth: AuthState }) => state.auth?.user;

export const selectLoginState = (state: { auth: AuthState }) => state.auth?.login;
export const selectRegisterState = (state: { auth: AuthState }) => state.auth?.register;
export const selectSendResetCodeState = (state: { auth: AuthState }) => state.auth?.sendResetCode;
export const selectVerifyCodeState = (state: { auth: AuthState }) => state.auth?.verifyCode;
export const selectResetPasswordState = (state: { auth: AuthState }) => state.auth?.resetPassword;

export const selectRegionsState = (state: { auth: AuthState }) => state.auth.regions;
export const selectDeptState = (state: { auth: AuthState }) => state.auth.depts;
export const selectArrondState = (state: { auth: AuthState }) => state.auth.arronds;
export const selectTownsState = (state: { auth: AuthState }) => state.auth.towns;