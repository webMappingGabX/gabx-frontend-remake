// dashboardSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "../../../api/axios";

export interface DashboardState {
  totalUsers: number;
  totalObservations: number;
  totalPlots: number;
  totalHE: number;
  loading: boolean;
  error: string | null;
  loadSucceed: boolean;

  activeUsers: number,
  inactiveUsers: number,
  suspendedUsers: number,
  adminUsers: number,
  expertUsers: number,
  defaultUsers: number,
  tenantUsers: number,
  builtPlots: number,
  unbuiltPlots: number,
  totalPlotArea: number,
  totalMarketValue: number,
  observationsByCategory: { category: string; count: number }[],
  userActivity: { date: string, count: number }[],
  recentActivies: { type: string, user: [] | null, createdAt: string, }[]
  totalBuildings: number,
  totalOverlaps: number,
  totalOverlapsArea: number,
}

const initialState: DashboardState = {
  totalUsers: 0,
  totalObservations: 0,
  totalPlots: 0,
  totalHE: 0,
  loading: false,
  error: null,
  loadSucceed: false,

  activeUsers: 0,
  inactiveUsers: 0,
  suspendedUsers: 0,
  adminUsers: 0,
  expertUsers: 0,
  defaultUsers: 0,
  tenantUsers: 0,
  builtPlots: 0,
  unbuiltPlots: 0,
  totalPlotArea: 0,
  totalMarketValue: 0,
  totalBuildings: 0,
  observationsByCategory: [
    { category: "PEINT", count: 42 }
  ],
  userActivity: [
    { date: "04-09-2025", count: 14 }
  ],
  recentActivies: [],
  totalOverlaps: 0,
  totalOverlapsArea: 0,
};

// Async thunks for fetching stats
export const fetchDashboardStats = createAsyncThunk(
  "dashboard/fetchStats",
  async () => {
    try {
      // Fetch all stats in parallel
      const [
            usersStats, buildingsStats, 
            overlapsStats, observationsStats, 
            plotsStats, heStats, 
            userActivityStats
        ] = await Promise.all([
            axios.get("/users/dashboard/stats"),
            axios.get("/buildings/dashboard/stats"),
            axios.get("/overlaps/dashboard/stats"),
            axios.get("/observations/dashboard/stats"),
            axios.get("/plots/dashboard/stats"),
            axios.get("/housing-estates/dashboard/stats"),
            axios.get("/users/dashboard/activity"),
        ]);

      return {
        users: usersStats.data,
        buildings: buildingsStats.data,
        overlaps: overlapsStats.data,
        observations: observationsStats.data,
        plots: plotsStats.data,
        housingEstates: heStats.data,
        userActivity: userActivityStats.data,
      };
    } catch (err: any) {
      console.log("FAILED TO LOAD DASHBOARD STATS", err);
      throw err;
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.loadSucceed = false;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        console.log("ACTIONS RESULT", action);
        state.loading = false;
        state.totalUsers = action.payload.users.total || 0;
        state.totalObservations = action.payload.observations.total || 0;
        state.totalPlots = action.payload.plots.total || 0;
        state.totalHE = action.payload.housingEstates.totalHousingEstates || 0;
        state.loadSucceed = true;

        state.activeUsers = action.payload.users.active || 0;
        state.adminUsers = action.payload.users.admin || 0;
        state.defaultUsers = action.payload.users.default || 0;
        state.expertUsers = action.payload.users.expert || 0;
        state.inactiveUsers = action.payload.users.inactive || 0;
        state.suspendedUsers = action.payload.users.suspend || 0;
        state.tenantUsers = action.payload.users.tenant || 0;

        state.totalBuildings = action.payload.buildings.totalBuildings || 0;

        state.totalOverlaps = action.payload.overlaps.total || 0;
        state.totalOverlapsArea = action.payload.overlaps.totalArea || 0;
        state.recentActivies = action.payload.userActivity || 0;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch dashboard stats";
        state.loadSucceed = false;
      });
  },
});

export const { clearError } = dashboardSlice.actions;

// Selectors
export const selectDashboardStats = (state: { dashboard: DashboardState }) => state.dashboard;
export const selectDashboardLoading = (state: { dashboard: DashboardState }) => state.dashboard.loading;
export const selectDashboardError = (state: { dashboard: DashboardState }) => state.dashboard.error;

export default dashboardSlice.reducer;