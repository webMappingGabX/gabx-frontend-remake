// store/rootReducer.js
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
//import settingReducer from './slices/settingSlice';
// import userReducer from './slices/userSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  //setting: settingReducer
  // user: userReducer,
});

export default rootReducer;