import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import rootReducer from './store/rootReducer';

const persistConfig = {
    key: "root",
    storage,
    whitelist: ["auth", "user", "setting"]
    // blacklist: ["test"]
};

const persistReduc = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistReduc,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
                //ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"]
            },
        }),
    devTools: process.env.NODE_ENV !== "production",
});

export const persistor = persistStore(store);