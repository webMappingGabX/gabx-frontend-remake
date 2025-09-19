import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axios from "../../../api/axios";


// Types based on User model
export interface User {
    id?: number;
    username?: string;
    email?: string;
    password?: string;
    role?: string;
    profession?: string;
    resetCode?: string;
    resetCodeExpiresAt?: string;
    locationCode?: string;
    status?: string;
}

export interface UserState {
    users: User[];
    currentUser: User | null;
    loading: boolean;
    error: string | null;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    filters: {
        search?: string;
        role?: string;
        status?: string;
        sortBy?: string;
        sortOrder?: "ASC" | "DESC";
    };
}

const initialState: UserState = {
    users: [],
    currentUser: null,
    loading: false,
    error: null,
    pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    },
    filters: {
        search: "",
        sortBy: "username",
        sortOrder: "ASC"
    }
};

// Async thunks based on usersController endpoints
export const fetchUsers = createAsyncThunk(
    'plots/fetchUsers',
    async (params: {
        search?: string;
        page?: number;
        limit?: number;
        role?: string;
        status?: string;
        sortBy?: string;
        sortOrder?: "ASC" | "DESC";
    } = {}) => {
        try {
            const response = await axios.get('/users', { params });
            return response.data;
        } catch (err) {
            console.log("GET USERS ERROR     ", err);
            return null;
        } 
    }
);

export const fetchUserById = createAsyncThunk(
    'plots/fetchUserById',
    async (id: string) => {
        try {
            console.log("FIRST LOAD A");
            const response = await axios.get(`/users/${id}`);
            console.log("FIRST LOAD", response);
            return response.data;
        } catch (err) {
            console.log("GET USER ERROR     ", err);
            return null;
        } 
        
    }
);

export const createUser = createAsyncThunk(
    'plots/createUser',
    async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
        const response = await axios.post('/users', userData);
        return response.data;
    }
);

export const updateUser = createAsyncThunk(
    'plots/updateUser',
    async ({ id, userData }: { id: string; userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> }) => {
        const response = await axios.patch(`/users/${id}`, userData);
        return response.data;
    }
);

export const deleteUser = createAsyncThunk(
    'plots/deleteUser',
    async (id) => {
        const response = await axios.delete(`/users/${id}`);
        return response.data;
    }
);

export const fetchMe = createAsyncThunk(
    'plots/fetchMe',
    async () => {
        const response = await axios.get(`/users/me`);
        return response.data;
    }
);

export const updateAccount = createAsyncThunk(
    'plots/updateAccount',
    async () => {
        const response = await axios.get(`/users/update-account`);
        return response.data;
    }
);

export const deleteAccount = createAsyncThunk(
    'plots/deleteAccount',
    async () => {
        const response = await axios.get(`/users/delete-account`);
        return response.data;
    }
);


const userSlice = createSlice({
    name: "users",
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<UserState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = {
                search: "",
                sortBy: "username",
                sortOrder: "ASC"
            };
        },
        setCurrentUser: (state, action: PayloadAction<User | null>) => {
            state.currentUser = action.payload;
        },
        clearCurrentUser: (state) => {
            state.currentUser = null;
        },
        clearError: (state) => {
            state.error = null;
        },
        setPagination: (state, action: PayloadAction<Partial<UserState['pagination']>>) => {
            state.pagination = { ...state.pagination, ...action.payload };
        }
    },
    extraReducers: (builder) => {
        // Fetch users
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload.data || action.payload;
                if (action.payload.pagination) {
                    state.pagination = action.payload.pagination;
                }
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch users';
            });

        // Fetch user by id
        builder
            .addCase(fetchUserById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUser = action.payload;
            })
            .addCase(fetchUserById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch user';
            });

        // Create user
        builder
            .addCase(createUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createUser.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.user) {
                    state.users.push(action.payload.user);
                }
            })
            .addCase(createUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to create user';
            });

        // Update user
        builder
            .addCase(updateUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.user) {
                    const index = state.users.findIndex(user => user.id === action.payload.user.id);
                    if (index !== -1) {
                        state.users[index] = action.payload.user;
                    }
                    if (state.currentUser?.id === action.payload.user.id) {
                        state.currentUser = action.payload.user;
                    }
                }
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to update user';
            });

        // Delete user
        builder
            .addCase(deleteUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.loading = false;
                state.users = state.users.filter(user => user.id !== action.payload.id);
                if (state.currentUser?.id === action.payload.id) {
                    state.currentUser = null;
                }
            })
            .addCase(deleteUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to delete user';
            });

        // Fetch me
        builder
            .addCase(fetchMe.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMe.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUser = action.payload;
            })
            .addCase(fetchMe.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch current user';
            });

        // Update account
        builder
            .addCase(updateAccount.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateAccount.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.user) {
                    state.currentUser = action.payload.user;
                }
            })
            .addCase(updateAccount.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to update account';
            });

        // Delete account
        builder
            .addCase(deleteAccount.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteAccount.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUser = null;
            })
            .addCase(deleteAccount.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to delete account';
            });
    }
});

export const {
    setFilters,
    clearFilters,
    setCurrentUser,
    clearError,
    setPagination,
    clearCurrentUser
} = userSlice.actions;

export default userSlice.reducer;

// Selectors
export const selectUsers = (state: { users: UserState }) => state.users.users;
export const selectCurrentUser = (state: { users: UserState }) => state.users.currentUser;
export const selectUsersLoading = (state: { users: UserState }) => state.users.loading;
export const selectUsersError = (state: { users: UserState }) => state.users.error;
export const selectUsersPagination = (state: { users: UserState }) => state.users.pagination;
export const selectUsersFilters = (state: { users: UserState }) => state.users.filters;

