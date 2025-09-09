// store/rootReducer.js
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import settingReducer from './slices/settingSlice';
import plotReducer from './slices/plotSlice';
import housingEstateReducer from './slices/housingEstateSlice';
// import userReducer from './slices/userSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  setting: settingReducer,
  plots: plotReducer,
  housingEstates: housingEstateReducer
  // user: userReducer,
});

export default rootReducer;