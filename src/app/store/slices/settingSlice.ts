import { createSlice } from "@reduxjs/toolkit";

export interface SettingState {
    search : boolean;
    layers : boolean;
}

const initialState : SettingState = {
    search : false,
    layers : false
}

const settingSlice = createSlice({
    name: "settings",
    initialState,
    reducers: {
        toggleSearch: (state) => {
            //state.search = !state.search;
            state.search = true;
        },
        toggleLayers: (state) => {
            //state.layers = !state.layers;
            state.layers = false;
        }
    }
});

export const {
    toggleSearch,
    toggleLayers
} = settingSlice.actions;

export default settingSlice.reducer;

// Selectors
export const selectSearch = (state : { setting : SettingState }) => state.setting.search;
export const selectLayers = (state : { setting : SettingState }) => state.setting.layers;

