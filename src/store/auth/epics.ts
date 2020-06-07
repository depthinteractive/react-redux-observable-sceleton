import { AxiosResponse } from 'axios';
import { combineEpics, ofType } from "redux-observable";
import { switchMap, map, catchError } from "rxjs/operators";
import { from, of, Observable, throwError } from "rxjs";
// store
import store from '../index';
import { IAuth, Types, IOnLogged, IOnLogout, IOnLogin, ILogout, ILogin, onLogoutAction, logoutAction, loginAction } from './actions';
// core
import Axios from '../../core/axios';
import { IGraphql, IResponse } from '../../core/Response';

let timeout: NodeJS.Timeout;

export const logout = (action$: Observable<IOnLogout>): Observable<ILogout> =>
  action$.pipe(
    ofType(Types.ON_LOGOUT),
    map((): ILogout => {
      localStorage.removeItem('token');
      localStorage.removeItem('expiryDate');
      localStorage.removeItem('userId');
      return logoutAction()
    })
  );

export const logged = (action$: Observable<IOnLogged>): Observable<ILogin> =>
  action$.pipe(
    ofType(Types.ON_LOGGED),
    switchMap((): Observable<ILogin> => {
      const token: string | null = localStorage.getItem('token');
      const expiryDate: string | null = localStorage.getItem('expiryDate');
      
      if(token && expiryDate && (new Date(expiryDate) <= new Date())){
        const userId: string = localStorage.getItem('userId') as string; //'5dfb64b703cab32a0424d55d'
        const requestBody = {
          query: `
            query ReadUser($id: ID!){
              readUser(input: {_id: $id}){
                email
              }
            }
          `,
          variables: { id: userId }
        };

        return from(Axios({ data: requestBody })).pipe(
          map((res: AxiosResponse<IResponse<IGraphql<IAuth>>>): ILogin => {
            const user: IAuth = res.data.data.readUser;
            return loginAction(user);
          }),
          catchError((err) => throwError(err))
        )
      }
      return of();
    })
  );

export const login = (action$: Observable<IOnLogin>): Observable<ILogin> =>
  action$.pipe(
    ofType(Types.ON_LOGIN),
    switchMap((action: IOnLogin): Observable<ILogin> => {
      const requestBody = {
        query: `
          query Login($email: String!, $password: String!) {
            login(email: $email, password: $password) {
              email
              userId
              token
              tokenExpiration
            }
          }
        `,
        variables: { email: action.payload.email, password: action.payload.password }
      };

      return from(Axios({ data: requestBody })).pipe(
        map((res: AxiosResponse<IResponse<IGraphql<IAuth>>>): ILogin => {
          if(timeout) clearTimeout(timeout); 

          const user: IAuth = res.data.data.login;
          const remainingMilliseconds: number = 60 * 60 * 1000;
          const expiryDate: Date = new Date(new Date().getTime() + remainingMilliseconds);

          localStorage.setItem('token', user.token as string);
          localStorage.setItem('userId', user.userId as string);
          localStorage.setItem('expiryDate', expiryDate.toISOString());
          timeout = setTimeout(() => store.dispatch(onLogoutAction()), remainingMilliseconds);
          return loginAction(user);
        }),
        catchError((err) => throwError(err))
      )
    })
  );
  
export default combineEpics(logout, logged, login);