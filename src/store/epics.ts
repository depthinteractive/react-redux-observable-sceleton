import { combineEpics, createEpicMiddleware, Epic } from 'redux-observable';
import { AppActions } from './actions';
// epics
import authEpic from './auth/epics';

export const rootEpic: Epic<AppActions, AppActions> = combineEpics(authEpic);

export default createEpicMiddleware();