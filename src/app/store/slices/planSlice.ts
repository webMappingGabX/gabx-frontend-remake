import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axios from "../../../api/axios";

// Types based on Plan model
export interface Plan {
    id?: number;
    code: string;
    geom?: Record<string, unknown>; // GeoJSON geometry
    housingEstateId?: number;
    HousingEstate?: Record<string, unknown>; // Related housing estate
    createdAt?: string;
    updatedAt?: string;
}


export interface PlanState {
    plans: Plan[];
    plansForDD: Plan[],
    currentPlan: Plan | null;
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
        sortBy?: string;
        excludeType?: string[];
        sortOrder?: "ASC" | "DESC";
    };
}

const initialState: PlanState = {
    plans: [],
    plansForDD: [],
    currentPlan: null,
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
        excludeType: [],
        sortBy: "code",
        sortOrder: "ASC"
    }
};

// Async thunks based on planController endpoints
export const fetchPlans = createAsyncThunk(
    'plans/fetchPlans',
    async (params: {
        search?: string;
        page?: number;
        excludeType?: string[];
        limit?: number;
        sortBy?: string;
        sortOrder?: "ASC" | "DESC";
    } = {}) => {
        try {
            const response = await axios.get('/plans', { params });
            return response.data;
        } catch (err) {
            console.log("GET PLANS ERROR     ", err);
            return null;
        } 
    }
);

export const fetchDropdownPlans = createAsyncThunk(
    'plans/fetchDropdownPlans',
    async (params: {
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: "ASC" | "DESC";
    } = {}) => {
        try {
            const response = await axios.get('/plans', { params });
            return response.data;
        } catch (err) {
            console.log("GET PLANS ERROR     ", err);
            return null;
        } 
    }
);

export const fetchPlanById = createAsyncThunk(
    'plans/fetchPlanById',
    async (id) => {
        const response = await axios.get(`/plans/${id}`);
        return response.data;
    }
);

export const createPlan = createAsyncThunk(
    'plans/createPlan',
    async (planData: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
        try {
            const response = await axios.post('/plans', planData);
            return response.data;
        } catch (error) {
            console.log("ERROR CREATING PLAN", error);
            const axiosError = error;
            return rejectWithValue(axiosError.response?.data?.message || 'Erreur de connexion au serveur');
        }
    }
);

export const createBuilding = createAsyncThunk(
    'plans/createBuilding',
    async (buildingData: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
        try {
            //const response = await axios.post('/plans/building', buildingData);
            const response = await axios.post('/buildings', buildingData);
            return response.data;
        } catch (error) {
            console.log("ERROR CREATING BUILDING", error);
            const axiosError = error;
            return rejectWithValue(axiosError.response?.data?.message || 'Erreur de connexion au serveur');
        }
    }
);

export const updatePlan = createAsyncThunk(
    'plans/updatePlan',
    async ({ code, updateData }: { code: string; updateData: Partial<Plan> }) => {
        const response = await axios.patch(`/plans/${code}`, updateData);
        return response.data;
    }
);

export const deletePlan = createAsyncThunk(
    'plans/deletePlan',
    async (code: string) => {
        const response = await axios.delete(`/plans/${code}`);
        return { code, message: response.data.message };
    }
);

const planSlice = createSlice({
    name: "plans",
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<PlanState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = {
                search: "",
                sortBy: "code",
                sortOrder: "ASC"
            };
        },
        setCurrentPlan: (state, action: PayloadAction<Plan | null>) => {
            state.currentPlan = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        setPagination: (state, action: PayloadAction<Partial<PlanState['pagination']>>) => {
            state.pagination = { ...state.pagination, ...action.payload };
        }
    },
    extraReducers: (builder) => {
        // Fetch plans
        builder
            .addCase(fetchPlans.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPlans.fulfilled, (state, action) => {
                state.loading = false;
                state.plans = action.payload.data || action.payload;
                if (action.payload.pagination) {
                    state.pagination = action.payload.pagination;
                }
            })
            .addCase(fetchPlans.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch plans';
            });
        
        
        // Fetch plans for dropdown
        builder
        .addCase(fetchDropdownPlans.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchDropdownPlans.fulfilled, (state, action) => {
            state.loading = false;
            state.plansForDD = action.payload.data || action.payload;
        })
        .addCase(fetchDropdownPlans.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to fetch plans';
        });

        // Fetch plan by code
        builder
            .addCase(fetchPlanById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPlanById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPlan = action.payload;
            })
            .addCase(fetchPlanById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch plan';
            });

        // Create plan
        builder
            .addCase(createPlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createPlan.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.plan) {
                    state.plans.push(action.payload.plan);
                }
            })
            .addCase(createPlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to create plan';
            });

        // Update plan
        builder
            .addCase(updatePlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePlan.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.plan) {
                    const index = state.plans.findIndex(plan => plan.code === action.payload.plan.code);
                    if (index !== -1) {
                        state.plans[index] = action.payload.plan;
                    }
                    if (state.currentPlan?.code === action.payload.plan.code) {
                        state.currentPlan = action.payload.plan;
                    }
                }
            })
            .addCase(updatePlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to update plan';
            });

        // Delete plan
        builder
            .addCase(deletePlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deletePlan.fulfilled, (state, action) => {
                state.loading = false;
                state.plans = state.plans.filter(plan => plan.code !== action.payload.code);
                if (state.currentPlan?.code === action.payload.code) {
                    state.currentPlan = null;
                }
            })
            .addCase(deletePlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to delete plan';
            });
        
        // create building
        builder
            .addCase(createBuilding.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createBuilding.fulfilled, (state, action) => {
                state.loading = false;
            })
            .addCase(createBuilding.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to create building';
            });
    }
});

export const {
    setFilters,
    clearFilters,
    setCurrentPlan,
    clearError,
    setPagination
} = planSlice.actions;

export default planSlice.reducer;

// Selectors
export const selectPlans = (state: { plans: PlanState }) => state.plans.plans;
export const selectCurrentPlan = (state: { plans: PlanState }) => state.plans.currentPlan;
export const selectPlansLoading = (state: { plans: PlanState }) => state.plans.loading;
export const selectPlansError = (state: { plans: PlanState }) => state.plans.error;
export const selectPlansPagination = (state: { plans: PlanState }) => state.plans.pagination;
export const selectPlansFilters = (state: { plans: PlanState }) => state.plans.filters;

