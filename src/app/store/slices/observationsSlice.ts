import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axios from "../../../api/axios";


// Types based on User model
export interface Observation {
    id?: number;
    category?: string;
    scale?: number;
    content?: string;
    userId?: number;
}

export interface ObservationState {
    observations: Observation[];
    currentObservation: Observation | null;
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
        category?: string;
        sortBy?: string;
        sortOrder?: "ASC" | "DESC";
    };
}

const initialState: ObservationState = {
    observations: [],
    currentObservation: null,
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
        sortBy: "category",
        sortOrder: "ASC"
    }
};

// Async thunks based on usersController endpoints
export const fetchObservations = createAsyncThunk(
    'plots/fetchObservations',
    async (params: {
        search?: string;
        page?: number;
        limit?: number;
        observation?: string;
        sortBy?: string;
        sortOrder?: "ASC" | "DESC";
    } = {}) => {
        try {
            const response = await axios.get('/observations', { params });
            return response.data;
        } catch (err) {
            console.log("GET OBSERVATIONS ERROR     ", err);
            return null;
        } 
    }
);

export const fetchObsById = createAsyncThunk(
    'plots/fetchObsById',
    async (id: string) => {
        const response = await axios.get(`/observations/${id}`);
        return response.data;
    }
);

export const createObs = createAsyncThunk(
    'plots/createObs',
    async (obsData: Omit<Observation, 'id' | 'createdAt' | 'updatedAt'>) => {
        const response = await axios.post('/observations', obsData);
        return response.data;
    }
);

export const updateObs = createAsyncThunk(
    'plots/updateUser',
    async ({ id, obsData }: { id: string; obsData: Omit<Observation, 'id' | 'createdAt' | 'updatedAt'> }) => {
        const response = await axios.patch(`/observations/${id}`, obsData);
        return response.data;
    }
);

export const deleteObs = createAsyncThunk(
    'plots/deleteObs',
    async (id) => {
        const response = await axios.delete(`/observations/${id}`);
        return response.data;
    }
);


const observationSlice = createSlice({
    name: "observations",
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<ObservationState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = {
                search: "",
                sortBy: "category",
                sortOrder: "ASC"
            };
        },
        setCurrentObservation: (state, action: PayloadAction<Observation | null>) => {
            state.currentObservation = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        setPagination: (state, action: PayloadAction<Partial<ObservationState['pagination']>>) => {
            state.pagination = { ...state.pagination, ...action.payload };
        }
    },
    extraReducers: (builder) => {
        // Fetch observations
        builder
            .addCase(fetchObservations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchObservations.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload) {
                    state.observations = action.payload.data || action.payload;
                    if (action.payload.pagination) {
                        state.pagination = action.payload.pagination;
                    }
                }
            })
            .addCase(fetchObservations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch observations';
            });

        // Fetch observation by id
        builder
            .addCase(fetchObsById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchObsById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentObservation = action.payload;
            })
            .addCase(fetchObsById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch observation';
            });

        // Create observation
        builder
            .addCase(createObs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createObs.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload) {
                    state.observations.push(action.payload);
                }
            })
            .addCase(createObs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to create observation';
            });

        // Update observation
        builder
            .addCase(updateObs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateObs.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload) {
                    const index = state.observations.findIndex(obs => obs.id === action.payload.id);
                    if (index !== -1) {
                        state.observations[index] = action.payload;
                    }
                    if (state.currentObservation?.id === action.payload.id) {
                        state.currentObservation = action.payload;
                    }
                }
            })
            .addCase(updateObs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to update observation';
            });

        // Delete observation
        builder
            .addCase(deleteObs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteObs.fulfilled, (state, action) => {
                state.loading = false;
                state.observations = state.observations.filter(obs => obs.id !== action.payload.id);
                if (state.currentObservation?.id === action.payload.id) {
                    state.currentObservation = null;
                }
            })
            .addCase(deleteObs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to delete observation';
            });
    }
});

export const {
    setFilters,
    clearFilters,
    setCurrentObservation,
    clearError,
    setPagination
} = observationSlice.actions;

export default observationSlice.reducer;

// Selectors
export const selectObservations = (state: { observations: ObservationState }) => state.observations.observations;
export const selectCurrentObservation = (state: { observations: ObservationState }) => state.observations.currentObservation;
export const selectObservationsLoading = (state: { observations: ObservationState }) => state.observations.loading;
export const selectObservationsError = (state: { observations: ObservationState }) => state.observations.error;
export const selectObservationsPagination = (state: { observations: ObservationState }) => state.observations.pagination;
export const selectObservationsFilters = (state: { observations: ObservationState }) => state.observations.filters;

