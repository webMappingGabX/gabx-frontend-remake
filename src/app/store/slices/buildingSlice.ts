import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axios from "../../../api/axios";

// Building Format
/*export interface BuildingFormat {
    crs: 
}*/

// Types based on Building model
export interface Building {
    id?: number;
    code: string;
    geom?: Record<string, unknown>; // GeoJSON geometry
    plotId?: number;
    state?: number;
    nbLevels?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface BuildingState {
    buildings: Building[];
    currentBuilding: Building | null;
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
        status?: string;
        sortBy?: string;
        sortOrder?: "ASC" | "DESC";
    };
}

const initialState: BuildingState = {
    buildings: [],
    currentBuilding: null,
    loading: false,
    error: null,
    pagination: {
        page: 1,
        limit: 100,
        total: 0,
        totalPages: 0
    },
    filters: {
        search: "",
        sortBy: "code",
        sortOrder: "ASC"
    }
};

// Async thunks based on buildingController endpoints
export const fetchBuildings = createAsyncThunk(
    'buildings/fetchBuildings',
    async (params: {
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: "ASC" | "DESC";
    } = {}) => {
        try {
            const response = await axios.get('/buildings', { params });
            // show url
            return response.data;
        } catch (err) {
            console.log("GET BUILDINGS ERROR     ", err);
            return null;
        } 
    }
);

export const fetchBuildingById = createAsyncThunk(
    'buildings/fetchBuildingById',
    async (id) => {
        const response = await axios.get(`/buildings/${id}`);
        return response.data;
    }
);

export const createBuilding = createAsyncThunk(
    'buildings/createBuilding',
    async (buildingData: Omit<Building, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
        try {
            const response = await axios.post('/buildings', buildingData);
            return response.data;
        } catch (error) {
            console.log("ERROR CREATING BUILDING", error);
            const axiosError = error;
            return rejectWithValue(axiosError.response?.data?.message || 'Erreur de connexion au serveur');
        }
    }
);

export const updateBuilding = createAsyncThunk(
    'buildings/updateBuilding',
    async ({ code, updateData }: { code: string; updateData: Partial<Building> }) => {
        const response = await axios.patch(`/buildings/${code}`, updateData);
        return response.data;
    }
);

export const deleteBuilding = createAsyncThunk(
    'buildings/deleteBuilding',
    async (code: string) => {
        const response = await axios.delete(`/buildings/${code}`);
        return { code, message: response.data.message };
    }
);

const buildingSlice = createSlice({
    name: "building",
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<BuildingState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = {
                search: "",
                sortBy: "code",
                sortOrder: "ASC"
            };
        },
        setCurrentBuilding: (state, action: PayloadAction<Building | null>) => {
            state.currentBuilding = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        setPagination: (state, action: PayloadAction<Partial<BuildingState['pagination']>>) => {
            state.pagination = { ...state.pagination, ...action.payload };
        }
    },
    extraReducers: (builder) => {
        // Fetch buildings
        builder
            .addCase(fetchBuildings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBuildings.fulfilled, (state, action) => {
                state.loading = false;
                state.buildings = action.payload.data || action.payload;
                if (action.payload.pagination) {
                    state.pagination = action.payload.pagination;
                }
            })
            .addCase(fetchBuildings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch buildings';
            });

        // Fetch building by code
        builder
            .addCase(fetchBuildingById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBuildingById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentBuilding = action.payload;
            })
            .addCase(fetchBuildingById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch building';
            });

        // Create building
        builder
            .addCase(createBuilding.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createBuilding.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.building) {
                    state.buildings.push(action.payload.building);
                }
            })
            .addCase(createBuilding.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to create building';
            });

        // Update building
        builder
            .addCase(updateBuilding.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateBuilding.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.building) {
                    const index = state.buildings.findIndex(building => building.code === action.payload.building.code);
                    if (index !== -1) {
                        state.buildings[index] = action.payload.building;
                    }
                    if (state.currentBuilding?.code === action.payload.building.code) {
                        state.currentBuilding = action.payload.building;
                    }
                }
            })
            .addCase(updateBuilding.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to update building';
            });

        // Delete building
        builder
            .addCase(deleteBuilding.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteBuilding.fulfilled, (state, action) => {
                state.loading = false;
                state.buildings = state.buildings.filter(building => building.code !== action.payload.code);
                if (state.currentBuilding?.code === action.payload.code) {
                    state.currentBuilding = null;
                }
            })
            .addCase(deleteBuilding.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to delete building';
            });
    }
});

export const {
    setFilters,
    clearFilters,
    setCurrentBuilding,
    clearError,
    setPagination
} = buildingSlice.actions;

export default buildingSlice.reducer;

// Selectors
export const selectBuildings = (state: { building: BuildingState }) => state.building.buildings;
export const selectCurrentBuilding = (state: { building: BuildingState }) => state.building.currentBuilding;
export const selectBuildingsLoading = (state: { building: BuildingState }) => state.building.loading;
export const selectBuildingsError = (state: { building: BuildingState }) => state.building.error;
export const selectBuildingsPagination = (state: { building: BuildingState }) => state.building.pagination;
export const selectBuildingsFilters = (state: { building: BuildingState }) => state.building.filters;

