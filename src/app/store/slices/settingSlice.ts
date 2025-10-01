import { createSlice } from "@reduxjs/toolkit";

export interface SettingState {
    search : boolean;
    layers : boolean;
    overlaps : boolean;
    menu : AvailableMenus | null;
}

export enum AvailableMenus {
    FILE = "FILE",
    EDIT = "EDIT",
    VIEW = "VIEW",
    EXPORT = "EXPORT",
    HELP = "HELP"
}

const initialState : SettingState = {
    search : false,
    layers : false,
    overlaps: true,
    menu : null
}

const settingSlice = createSlice({
    name: "settings",
    initialState,
    reducers: {
        toggleSearch: (state) => {
            state.search = !state.search;
        },
        toggleLayers: (state) => {
            state.layers = !state.layers;
        },
        toggleOverlaps: (state) => {
            state.overlaps = !state.overlaps;
        },
        openMenu: (state, action : { payload: AvailableMenus }) => {
            state.menu = action.payload;
            // state.menu = state.menu === action.payload ? null : action.payload;
        },
        closeMenu: (state) => {
            state.menu = null;
        }
    }
});

export const {
    toggleSearch,
    toggleLayers,
    toggleOverlaps,
    openMenu,
    closeMenu
} = settingSlice.actions;

export default settingSlice.reducer;

// Selectors
export const selectSearch = (state : { setting : SettingState }) => state.setting.search;
export const selectLayers = (state : { setting : SettingState }) => state.setting.layers;
export const selectOverlaps = (state : { setting : SettingState }) => state.setting.overlaps;
export const selectMenu = (state : { setting: SettingState }) => state.setting.menu;

