import React, { Component } from 'react';
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ThunkDispatch } from 'redux-thunk';
import { connect, ConnectedProps } from 'react-redux';
import { bindActionCreators } from 'redux';
import _ from 'lodash';
// store
import { AppState } from '../store';
import { AppActions } from '../store/actions';
import { IAuth } from '../store/auth/actions';
import { onLogoutAction } from '../store/auth/actions';
// core
import { IResponse, IError, IResponseError } from './Response';
// components
import Error from '../components/blocks/error';

export interface IWithErrorHandler { errors: IResponseError[] | null; }

const withErrorHandler = (WrappedComponent: any, Axios: AxiosInstance) => {
  interface IProps {}
  interface IState extends IWithErrorHandler {
    hideError: boolean;
  }
  
  let reqInterceptor: number;
  let resInterceptor: number;
  const WithErrorHandlerContext = React.createContext<IWithErrorHandler | undefined>( undefined );
  const mapStateToProps = (state: AppState, ownProps: IProps) => ({ auth: state.auth });
  const mapDispatchToProps = (dispatch: ThunkDispatch<any, any, AppActions>, ownProps: IProps) => (bindActionCreators({ onLogoutAction }, dispatch));
  const connector = connect(mapStateToProps, mapDispatchToProps);

  type Props = ConnectedProps<typeof connector>;
  
  return connector(class extends Component<Props, IState> {
    constructor(props: Props) {
      super(props);
      this.state = { errors: null, hideError: true }
      this.init();
    }

    init = async (): Promise<void> => {
      reqInterceptor = Axios.interceptors.request.use(
        async (req: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
          const auth: IAuth = this.props.auth;
          if(auth.token){
            req.headers = {...req.headers, Authorization: 'Bearer ' + auth.token}
          }
          return req;
        });
      resInterceptor = Axios.interceptors.response.use(
        async (res: AxiosResponse<IResponse<any>>): Promise<AxiosResponse<IResponse<any>>> => res,
        async (err: IError<IResponseError>): Promise<never> => {
          let errors: IResponseError[] = [];
          if(err.response.data.errors === undefined){
            errors.push(err.response.data);
          }else if(err.response.data.errors instanceof Array){
            errors = [...err.response.data.errors];
          }
          
          _.map(errors, (err: IResponseError): void => {
            if(err.code === 422) this.props.onLogoutAction();
          });
          this.setState({ errors, hideError: false });
          return Promise.reject(err);
        });
    };

    componentWillUnmount (): void {
      Axios.interceptors.request.eject(reqInterceptor);
      Axios.interceptors.response.eject(resInterceptor);
    }

    onHideError (): void {
      this.setState({ hideError: !this.state.hideError });
    }

    render () {
      const context: IWithErrorHandler = { ...this.state };
      return (
        <>
          {this.state.errors && !this.state.hideError ? <Error errors={this.state.errors} hideError={this.onHideError} /> : null}
          <WithErrorHandlerContext.Provider value={ context }>
            <WrappedComponent { ...this.props } />
          </WithErrorHandlerContext.Provider>
        </>
      );
    }
  })
}
export default withErrorHandler;
