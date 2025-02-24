import * as types from './types';
import { instance } from '../src/utils/axios';

export const signUpUser = (newUserData, router) => dispatch => {
  dispatch({ type: types.LOADING_USER });
  instance
    .post('/signup', newUserData)
    .then(res => {
      if (res.data.token) {
        setAuthorizationHeader(res.data.token);
        dispatch(getAuthenticatedUser());
        dispatch({ type: types.CLEAR_ERRORS });
        router.push('/');
      } else {
        dispatch({
          type: types.SET_ERRORS,
          payload: 'No token received from server'
        });
      }
    })
    .catch(err => {
      console.error('Signup Error:', err);
      dispatch({
        type: types.SET_ERRORS,
        payload: err.response?.data?.general || 'Network error occurred during signup'
      });
    });
};


export const signInUser = (userData, router) => dispatch => {
  dispatch({ type: types.LOADING_USER });

  instance
    .post('/signin', userData)
    .then(res => {
      setAuthorizationHeader(res.data.token);
      dispatch(getAuthenticatedUser());
      router.push('/');
    })
    .catch(err => {
      dispatch({
        type: types.SET_ERRORS,
        payload: err.response.data.general,
      });
    });
};

export const uploadImage = (image) => dispatch => {
  instance
  .post('/user/image',image )
  .then(() => {
    dispatch(getAuthenticatedUser())
  })
  .catch((err) => {
    dispatch({
      type: types.SET_ERRORS,
      payload: err.response.data.error,
    });
  })
}

export const logoutUser = () => dispatch => {
  localStorage.removeItem('idToken');
  delete instance.defaults.headers.common['Authorization'];
  dispatch({ type: types.SET_UNAUTHENTICATED });
};

export const getAuthenticatedUser = () => dispatch => {
  instance
    .get('/user')
    .then(res => {
      dispatch({
        type: types.SET_USER,
        payload: res.data,
      });
    })
    .catch(err => console.log(err));
};

const setAuthorizationHeader = token => {
  const idToken = `Bearer ${token}`;
  localStorage.setItem('idToken', idToken);
  instance.defaults.headers.common['Authorization'] = idToken;
};
