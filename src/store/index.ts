import { createStore, applyMiddleware, compose, combineReducers, Store, Action, AnyAction, Reducer } from 'redux';
import thunk, { ThunkMiddleware } from "redux-thunk";
import { AppActions } from './actions';
// reducers
import authReducer from './auth/reducers';
import epicMiddleware, { rootEpic } from './epics';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const staticReducers = {
  auth: authReducer,
}
const rootReducer = combineReducers({
  ...staticReducers
});

export type AppState = ReturnType<typeof rootReducer>;
export interface IStore<S = any, A extends Action = AnyAction> extends Store<S, A> {
  injectReducers?: (reducers: { [key: string]: Reducer<S, A> }) => void;
}
const store: IStore<AppState, AppActions> = createStore(rootReducer, {}, composeEnhancers(applyMiddleware(thunk as ThunkMiddleware<AppState, AppActions>, epicMiddleware)));
store.injectReducers = (reducers: { [key: string]: Reducer<any, any> }): void => {
  store.replaceReducer(combineReducers({ ...staticReducers, ...reducers }));
}
epicMiddleware.run(rootEpic);
export default store;