import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axios from "../../../api/axios";

// Types based on HousingEstate model
export interface HousingEstate {
    id?: number;
    name?: string;
    region?: string;
    city?: string;
    department?: string;
    district?: string;
    place?: string;
    buildingsType?: "COLLECTIVE" | "INDIVIDUAL";
    category?: string;
    Plots?: Plot[]; // Related plots
    createdAt?: string;
    updatedAt?: string;
}

export interface Plot {
    id?: number;
    code: string;
    area?: number;
    status?: "BATI" | "NON BATI";
    marketValue?: number;
    region?: string;
    department?: string;
    district?: string;
    place?: string;
    housingEstateId?: number;
}

export interface HousingEstateStats {
    totalPlots: number;
    totalArea: number;
    builtPlots: number;
    unbuiltPlots: number;
    totalValue: number;
    regions: string[];
    departments: string[];
}

export interface HousingEstateState {
    housingEstates: HousingEstate[];
    currentHousingEstate: HousingEstate | null;
    currentStats: HousingEstateStats | null;
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
        region?: string;
        city?: string;
        departement?: string;
        district?: string;
        place?: string;
        buildingsType?: string;
        sortBy?: string;
        sortOrder?: "ASC" | "DESC";
    };
}

const initialState: HousingEstateState = {
    housingEstates: [],
    currentHousingEstate: null,
    currentStats: null,
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
        sortBy: "name",
        sortOrder: "ASC"
    }
};

// Helper function to propagate housing estate attributes to its plots
const propagateHousingEstateAttributes = (housingEstate: HousingEstate): HousingEstate => {
    if (!housingEstate.Plots || housingEstate.Plots.length === 0) {
        return housingEstate;
    }

    const updatedPlots = housingEstate.Plots.map(plot => ({
        ...plot,
        region: housingEstate.region || plot.region,
        department: housingEstate.department || plot.department,
        district: housingEstate.district || plot.district,
        place: housingEstate.place || plot.place
    }));

    return {
        ...housingEstate,
        Plots: updatedPlots
    };
};

// Async thunks based on housingEstateController endpoints
export const fetchHousingEstates = createAsyncThunk(
    'housingEstates/fetchHousingEstates',
    async (params: {
        search?: string;
        page?: number;
        limit?: number;
        region?: string;
        city?: string;
        departement?: string;
        district?: string;
        place?: string;
        buildingsType?: string;
        sortBy?: string;
        sortOrder?: "ASC" | "DESC";
    } = {}) => {
        const response = await axios.get('/housing-estates', { params });
        return response.data;
    }
);

export const fetchHousingEstateById = createAsyncThunk(
    'housingEstates/fetchHousingEstateById',
    async (id: number) => {
        const response = await axios.get(`/housing-estates/${id}`);
        return response.data;
    }
);

export const createHousingEstate = createAsyncThunk(
    'housingEstates/createHousingEstate',
    async (housingEstateData: HousingEstate) => {
        try {
            const response = await axios.post('/housing-estates', housingEstateData);
            return response.data;
        } catch (error) {
            console.log("CREATE HOUSING ESTATE ERROR     ", error)
        }
    }
);

export const updateHousingEstate = createAsyncThunk(
    'housingEstates/updateHousingEstate',
    async ({ id, updateData }: { id: number; updateData: HousingEstate }) => {
        const response = await axios.patch(`/housing-estates/${id}`, updateData);
        return response.data;
    }
);

export const deleteHousingEstate = createAsyncThunk(
    'housingEstates/deleteHousingEstate',
    async (id: number) => {
        const response = await axios.delete(`/housing-estates/${id}`);
        return { id, message: response.data.message };
    }
);

export const fetchHousingEstateStats = createAsyncThunk(
    'housingEstates/fetchHousingEstateStats',
    async (id: number) => {
        const response = await axios.get(`/housing-estates/${id}/stats`);
        return response.data;
    }
);

export const fetchHousingEstatesByRegion = createAsyncThunk(
    'housingEstates/fetchHousingEstatesByRegion',
    async (region: string) => {
        const response = await axios.get(`/housing-estates/region/${region}`);
        return response.data;
    }
);

const housingEstateSlice = createSlice({
    name: "housingEstates",
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<HousingEstateState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = {
                search: "",
                sortBy: "name",
                sortOrder: "ASC"
            };
        },
        setCurrentHousingEstate: (state, action: PayloadAction<HousingEstate | null>) => {
            state.currentHousingEstate = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        setPagination: (state, action: PayloadAction<Partial<HousingEstateState['pagination']>>) => {
            state.pagination = { ...state.pagination, ...action.payload };
        },
        clearStats: (state) => {
            state.currentStats = null;
        },
        propagateAttributesToPlots: (state, action: PayloadAction<number>) => {
            const housingEstateId = action.payload;
            const housingEstateIndex = state.housingEstates.findIndex(he => he.id === housingEstateId);
            
            if (housingEstateIndex !== -1) {
                state.housingEstates[housingEstateIndex] = propagateHousingEstateAttributes(state.housingEstates[housingEstateIndex]);
            }
            
            if (state.currentHousingEstate?.id === housingEstateId) {
                state.currentHousingEstate = propagateHousingEstateAttributes(state.currentHousingEstate);
            }
        }
    },
    extraReducers: (builder) => {
        // Fetch housing estates
        builder
            .addCase(fetchHousingEstates.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchHousingEstates.fulfilled, (state, action) => {
                state.loading = false;
                const housingEstates = action.payload.data || action.payload;
                // Propagate housing estate attributes to their plots
                state.housingEstates = Array.isArray(housingEstates) 
                    ? housingEstates.map(propagateHousingEstateAttributes)
                    : housingEstates;
                if (action.payload.pagination) {
                    state.pagination = action.payload.pagination;
                }
            })
            .addCase(fetchHousingEstates.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch housing estates';
            });

        // Fetch housing estate by id
        builder
            .addCase(fetchHousingEstateById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchHousingEstateById.fulfilled, (state, action) => {
                state.loading = false;
                // Propagate housing estate attributes to its plots
                state.currentHousingEstate = propagateHousingEstateAttributes(action.payload);
            })
            .addCase(fetchHousingEstateById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch housing estate';
            });

        // Create housing estate
        builder
            .addCase(createHousingEstate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createHousingEstate.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.housingEstate) {
                    // Propagate housing estate attributes to its plots
                    const housingEstateWithPropagatedAttributes = propagateHousingEstateAttributes(action.payload.housingEstate);
                    state.housingEstates.push(housingEstateWithPropagatedAttributes);
                }
            })
            .addCase(createHousingEstate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to create housing estate';
            });

        // Update housing estate
        builder
            .addCase(updateHousingEstate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateHousingEstate.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.housingEstate) {
                    // Propagate housing estate attributes to its plots
                    const housingEstateWithPropagatedAttributes = propagateHousingEstateAttributes(action.payload.housingEstate);
                    
                    const index = state.housingEstates.findIndex(he => he.id === housingEstateWithPropagatedAttributes.id);
                    if (index !== -1) {
                        state.housingEstates[index] = housingEstateWithPropagatedAttributes;
                    }
                    if (state.currentHousingEstate?.id === housingEstateWithPropagatedAttributes.id) {
                        state.currentHousingEstate = housingEstateWithPropagatedAttributes;
                    }
                }
            })
            .addCase(updateHousingEstate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to update housing estate';
            });

        // Delete housing estate
        builder
            .addCase(deleteHousingEstate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteHousingEstate.fulfilled, (state, action) => {
                state.loading = false;
                state.housingEstates = state.housingEstates.filter(he => he.id !== action.payload.id);
                if (state.currentHousingEstate?.id === action.payload.id) {
                    state.currentHousingEstate = null;
                }
            })
            .addCase(deleteHousingEstate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to delete housing estate';
            });

        // Fetch housing estate stats
        builder
            .addCase(fetchHousingEstateStats.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchHousingEstateStats.fulfilled, (state, action) => {
                state.loading = false;
                state.currentStats = action.payload;
            })
            .addCase(fetchHousingEstateStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch housing estate stats';
            });

        // Fetch housing estates by region
        builder
            .addCase(fetchHousingEstatesByRegion.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchHousingEstatesByRegion.fulfilled, (state, action) => {
                state.loading = false;
                // Propagate housing estate attributes to their plots
                state.housingEstates = Array.isArray(action.payload) 
                    ? action.payload.map(propagateHousingEstateAttributes)
                    : action.payload;
            })
            .addCase(fetchHousingEstatesByRegion.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch housing estates by region';
            });
    }
});

export const {
    setFilters,
    clearFilters,
    setCurrentHousingEstate,
    clearError,
    setPagination,
    clearStats,
    propagateAttributesToPlots
} = housingEstateSlice.actions;

export default housingEstateSlice.reducer;

// Selectors
export const selectHousingEstates = (state: { housingEstates: HousingEstateState }) => state.housingEstates.housingEstates;
export const selectCurrentHousingEstate = (state: { housingEstates: HousingEstateState }) => state.housingEstates.currentHousingEstate;
export const selectCurrentStats = (state: { housingEstates: HousingEstateState }) => state.housingEstates.currentStats;
export const selectHousingEstatesLoading = (state: { housingEstates: HousingEstateState }) => state.housingEstates.loading;
export const selectHousingEstatesError = (state: { housingEstates: HousingEstateState }) => state.housingEstates.error;
export const selectHousingEstatesPagination = (state: { housingEstates: HousingEstateState }) => state.housingEstates.pagination;
export const selectHousingEstatesFilters = (state: { housingEstates: HousingEstateState }) => state.housingEstates.filters;

