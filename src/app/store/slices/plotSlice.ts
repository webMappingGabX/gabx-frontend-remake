import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axios from "../../../api/axios";

// Plot Format
/*export interface PlotFormat {
    crs: 
}*/

// Types based on Plot model
export interface Plot {
    id?: number;
    code: string;
    geom?: Record<string, unknown>; // GeoJSON geometry
    regionId?: number;
    departmentId?: number;
    arrondissementId?: number;
    townId?: number;
    place?: string;
    TFnumber?: string;
    acquiredYear?: number;
    classification?: number;
    area?: number;
    price?: number;
    marketValue?: number;
    observations?: string;
    status?: "BATI" | "NON BATI";
    housingEstateId?: number;
    HousingEstate?: Record<string, unknown>; // Related housing estate
    createdAt?: string;
    updatedAt?: string;
}

export interface PlotState {
    plots: Plot[];
    currentPlot: Plot | null;
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

const initialState: PlotState = {
    plots: [],
    currentPlot: null,
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
        sortBy: "code",
        sortOrder: "ASC"
    }
};

// Async thunks based on plotController endpoints
export const fetchPlots = createAsyncThunk(
    'plots/fetchPlots',
    async (params: {
        search?: string;
        page?: number;
        limit?: number;
        region?: string;
        city?: string;
        departement?: string;
        district?: string;
        place?: string;
        status?: string;
        sortBy?: string;
        sortOrder?: "ASC" | "DESC";
    } = {}) => {
        try {
            const response = await axios.get('/plots', { params });
            return response.data;
        } catch (err) {
            console.log("GET PLOTS ERROR     ", err);
            return null;
        } 
    }
);

export const fetchPlotByCode = createAsyncThunk(
    'plots/fetchPlotByCode',
    async (code: string) => {
        const response = await axios.get(`/plots/${code}`);
        return response.data;
    }
);

export const createPlot = createAsyncThunk(
    'plots/createPlot',
    async (plotData: Omit<Plot, 'id' | 'createdAt' | 'updatedAt'>) => {
        const response = await axios.post('/plots', plotData);
        return response.data;
    }
);

export const updatePlot = createAsyncThunk(
    'plots/updatePlot',
    async ({ code, updateData }: { code: string; updateData: Partial<Plot> }) => {
        const response = await axios.patch(`/plots/${code}`, updateData);
        return response.data;
    }
);

export const deletePlot = createAsyncThunk(
    'plots/deletePlot',
    async (code: string) => {
        const response = await axios.delete(`/plots/${code}`);
        return { code, message: response.data.message };
    }
);

export const fetchPlotsByHousingEstate = createAsyncThunk(
    'plots/fetchPlotsByHousingEstate',
    async (housingEstateId: number) => {
        const response = await axios.get(`/plots/housing-estate/${housingEstateId}`);
        return response.data;
    }
);

export const fetchPlotsByRegion = createAsyncThunk(
    'plots/fetchPlotsByRegion',
    async (region: string) => {
        const response = await axios.get(`/plots/region/${region}`);
        return response.data;
    }
);

export const fetchPlotsByStatus = createAsyncThunk(
    'plots/fetchPlotsByStatus',
    async (status: string) => {
        const response = await axios.get(`/plots/status/${status}`);
        return response.data;
    }
);

const plotSlice = createSlice({
    name: "plots",
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<PlotState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = {
                search: "",
                sortBy: "code",
                sortOrder: "ASC"
            };
        },
        setCurrentPlot: (state, action: PayloadAction<Plot | null>) => {
            state.currentPlot = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        setPagination: (state, action: PayloadAction<Partial<PlotState['pagination']>>) => {
            state.pagination = { ...state.pagination, ...action.payload };
        }
    },
    extraReducers: (builder) => {
        // Fetch plots
        builder
            .addCase(fetchPlots.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPlots.fulfilled, (state, action) => {
                state.loading = false;
                state.plots = action.payload.data || action.payload;
                if (action.payload.pagination) {
                    state.pagination = action.payload.pagination;
                }
            })
            .addCase(fetchPlots.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch plots';
            });

        // Fetch plot by code
        builder
            .addCase(fetchPlotByCode.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPlotByCode.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPlot = action.payload;
            })
            .addCase(fetchPlotByCode.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch plot';
            });

        // Create plot
        builder
            .addCase(createPlot.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createPlot.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.plot) {
                    state.plots.push(action.payload.plot);
                }
            })
            .addCase(createPlot.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to create plot';
            });

        // Update plot
        builder
            .addCase(updatePlot.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePlot.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.plot) {
                    const index = state.plots.findIndex(plot => plot.code === action.payload.plot.code);
                    if (index !== -1) {
                        state.plots[index] = action.payload.plot;
                    }
                    if (state.currentPlot?.code === action.payload.plot.code) {
                        state.currentPlot = action.payload.plot;
                    }
                }
            })
            .addCase(updatePlot.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to update plot';
            });

        // Delete plot
        builder
            .addCase(deletePlot.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deletePlot.fulfilled, (state, action) => {
                state.loading = false;
                state.plots = state.plots.filter(plot => plot.code !== action.payload.code);
                if (state.currentPlot?.code === action.payload.code) {
                    state.currentPlot = null;
                }
            })
            .addCase(deletePlot.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to delete plot';
            });

        // Fetch plots by housing estate
        builder
            .addCase(fetchPlotsByHousingEstate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPlotsByHousingEstate.fulfilled, (state, action) => {
                state.loading = false;
                state.plots = action.payload;
            })
            .addCase(fetchPlotsByHousingEstate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch plots by housing estate';
            });

        // Fetch plots by region
        builder
            .addCase(fetchPlotsByRegion.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPlotsByRegion.fulfilled, (state, action) => {
                state.loading = false;
                state.plots = action.payload;
            })
            .addCase(fetchPlotsByRegion.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch plots by region';
            });

        // Fetch plots by status
        builder
            .addCase(fetchPlotsByStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPlotsByStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.plots = action.payload;
            })
            .addCase(fetchPlotsByStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch plots by status';
            });
    }
});

export const {
    setFilters,
    clearFilters,
    setCurrentPlot,
    clearError,
    setPagination
} = plotSlice.actions;

export default plotSlice.reducer;

// Selectors
export const selectPlots = (state: { plots: PlotState }) => state.plots.plots;
export const selectCurrentPlot = (state: { plots: PlotState }) => state.plots.currentPlot;
export const selectPlotsLoading = (state: { plots: PlotState }) => state.plots.loading;
export const selectPlotsError = (state: { plots: PlotState }) => state.plots.error;
export const selectPlotsPagination = (state: { plots: PlotState }) => state.plots.pagination;
export const selectPlotsFilters = (state: { plots: PlotState }) => state.plots.filters;

