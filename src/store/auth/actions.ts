export enum Types {
  LOGOUT = 'LOGOUT',
  LOGIN = 'LOGIN',
  ON_LOGOUT = 'ON_LOGOUT',
  ON_LOGGED = 'ON_LOGGED',
  ON_LOGIN = 'ON_LOGIN',
}

export interface IAuth {
  email: string | null, 
  token: string | null; 
  userId: string | null; 
  tokenExpiration: number | null;
}
export interface IOnLogin {
  type: typeof Types.ON_LOGIN;
  payload: any
}
export interface ILogin {
  type: typeof Types.LOGIN;
  payload: IAuth
}
export interface IOnLogout {
  type: typeof Types.ON_LOGOUT;
}
export interface ILogout {
  type: typeof Types.LOGOUT;
}
export interface IOnLogged {
  type: typeof Types.ON_LOGGED;
}

export const onLoggedAction = (): IOnLogged => ({ type: Types.ON_LOGGED });
export const onLogoutAction = (): IOnLogout => ({ type: Types.ON_LOGOUT });
export const logoutAction = (): ILogout => ({ type: Types.LOGOUT });
export const onLoginAction = (payload: any): IOnLogin => ({ type: Types.ON_LOGIN, payload });
export const loginAction = (payload: IAuth): ILogin => ({ type: Types.LOGIN, payload });

export type Actions = IOnLogged | IOnLogout | ILogout | IOnLogin | ILogin;