// store/rootReducer.js
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import settingReducer from './slices/settingSlice';
import plotReducer from './slices/plotSlice';
import userReducer from './slices/usersSlice';
import observationReducer from './slices/observationsSlice';
import housingEstateReducer from './slices/housingEstateSlice';
import dashboardReducer from './slices/dashboardSlice';
// import userReducer from './slices/userSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  setting: settingReducer,
  plots: plotReducer,
  housingEstates: housingEstateReducer,
  users: userReducer,
  observations: observationReducer,
  dashboard: dashboardReducer
});

export default rootReducer;