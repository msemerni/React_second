// // HW_10_Registration
// // скрестить вашу форму логина с actionFullLogin используя connect
// // написать actionFullRegister. которая:
// // - делает запрос на регистрацию;
// // - проверяет результат
// // - в случае успеха делает await dispatch(actionFullLogin(.....)). Таким образом рега автоматом вас логинит;
// // - сделать страницы логина и регистрации  в своем роутинге
// // - понаделать запросов и actionCreator-ов для всяких будущих страниц вашего проекта;

// // - сделать actionUser, который получает _id пользователя и используя запрос UserFindOne скачивает инфу о 
// //   каком-то пользователе в state promiseReducer. Необязательным параметром сделать имя промиса для actionPromise. 
// //   По умолчанию имя промиса - user

// // - сделать actionAboutMe, который:
// // - возвращает функцию (т. е. это thunk)
// // - используя getState, передаваемый в thunk, узнать _id текущего залогиненного пользователя
// // - задиспатчить actionUser с _id текущего пользователя и именем промиса "me"

import logo from './logo.svg';
import './App.scss';
import React, {useState, useEffect} from 'react';
import {createStore, applyMiddleware, combineReducers} from 'redux';
import thunk from 'redux-thunk';
import {Provider, connect} from 'react-redux';
import {Router, Route, Link, Redirect, Switch, useHistory} from 'react-router-dom';
import {createBrowserHistory} from "history";

function promiseReducer(state, {type, status, name, payload, error}){ //payload
  if (state === undefined){
      return {}
  }
  if (type === 'PROMISE'){
      return {
          ...state,
          [name]: {status, payload ,error}
      }
  }
  return state 
}

const actionPending   = name            => ({type: 'PROMISE', status: 'PENDING', name})
const actionFulfilled = (name, payload) => ({type: 'PROMISE', status: 'FULFILLED', name, payload})
const actionRejected  = (name, error)   => ({type: 'PROMISE', status: 'REJECTED', name, error})

const actionPromise = (name, promise) =>
  async dispatch => {
      dispatch(actionPending(name))
      try{
          let payload = await promise
          dispatch(actionFulfilled(name, payload))
          return payload
      }
      catch(err){
          dispatch(actionRejected(name, err))
      }
  }

const getGQL = url =>
  (query, variables = {}) =>
      fetch(url, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              ...(localStorage.authToken ? { Authorization: "Bearer " + localStorage.authToken } : {}),
              Accept: "application/json",
          },
          body: JSON.stringify({ query, variables }),
      })
          .then((res) => res.json())
          .then((data) => {
              if (data.data) {
                  return Object.values(data.data)[0];
              } else throw new Error(JSON.stringify(data.errors));
          });

const URL = `http://shop-roles.node.ed.asmer.org.ua/`

const gql = getGQL(`${URL}graphql`)

function jwtDecode(token){
  try{
      return JSON.parse(atob(token.split('.')[1]))
  }
  catch (e) {
  }
}

function authReducer(state={}, {type, token}){
  if (type === 'AUTH_LOGIN'){
      const payload = jwtDecode(token)
      if (payload)
          return {token, payload}
  }
  if (type === 'AUTH_LOGOUT'){
      return {}
  }
  return state
}

const actionAuthLogin = (token) => 
  (dispatch, getState) => {
      const oldState = getState().auth
      dispatch({type: 'AUTH_LOGIN', token})
      const newState = getState().auth
      if (newState !== oldState){
          localStorage.authToken = token
          store.dispatch(actionUser(store.getState().auth.payload.sub.id));
      }        
  }

const actionFullLogin = (login, password) =>
  async (dispatch) => {
      const gqlQuery = `query log($login:String, $password:String){
          login(login:$login, password:$password)
      }`
      const gqlPromise = gql(gqlQuery, {login, password})
      const action     = actionPromise('login', gqlPromise) 
      const result     = await dispatch(action)
      dispatch(actionAuthLogin(result))
  }

  const actionAuthLogout = () => 
  (dispatch) => {        
      dispatch({type: 'AUTH_LOGOUT'})
      localStorage.removeItem('authToken')
      store.dispatch(actionUser({}))
  }

  const actionFullRegister = (login, password, nick) => 
    async (dispatch) => {
      const gqlQuery = `mutation Register($login: String, $password: String, $nick: String) {
        UserUpsert(user: {login: $login, password: $password, nick: $nick}) {
          _id login nick
        }
      }`;
      const gqlPromise = gql(gqlQuery, { login, password, nick});
      const action = actionPromise("register", gqlPromise);
      const result = await dispatch(action);
      if (result) {
        await dispatch(actionFullLogin(login, password));
      }
    };


const actionUser = (_id) => {
  const gqlQuery = `query UserInfo ($ID: String) {
    UserFindOne (query: $ID) {
      _id login nick createdAt avatar{
        url
      }
    }
  }`;
  const gqlPromise = gql(gqlQuery, {ID: JSON.stringify([{_id}])})
  return actionPromise("userProfile", gqlPromise);
}

const combinedReducers = combineReducers({auth: authReducer,
                                          user: promiseReducer, })
const store = createStore(combinedReducers, applyMiddleware(thunk));

if (localStorage.authToken){
  store.dispatch(actionAuthLogin(localStorage.authToken))
}

store.subscribe(() => console.log(store.getState()))

const history = createBrowserHistory()

const RegisterForm = ({ onLogin }) => {
  const [nick, setNick] = useState("nick name");
  const [login, setLogin] = useState("login");
  const [password, setPassword] = useState("password");
  const [confirmPassword, setConfirmPassword] = useState("confirm password");
  return (
    <form className="m-auto p-5 w-50 text-center bg-light">
      <div className="mb-2 row">
        <label htmlFor="inputNick" className="col-sm-4 col-form-label text-end">Nick name:</label>
        <div className="col-sm-8">
          <input type="text" id="inputNick" className="form-control" placeholder={nick} required onChange={(e) => setNick(e.target.value)}/>
        </div>
      </div>
      <div className="mb-2 row">
        <label htmlFor="inputEmail" className="col-sm-4 col-form-label text-end">Email:</label>
        <div className="col-sm-8">
          <input type="email" id="inputEmail" className="form-control" placeholder={login} required onChange={(e) => setLogin(e.target.value)}/>
        </div>
      </div>
      <div className="mb-2 row">
        <label htmlFor="inputPass" className="col-sm-4 col-form-label text-end">Password:</label>
        <div className="col-sm-8">
        <input type="password" id="inputPass" className="form-control" placeholder={password} required onChange={(e) => setPassword(e.target.value)}/>
        </div>
      </div>
      <div className="mb-2 row">
        <label htmlFor="inputConfPass" className="col-sm-4 col-form-label text-end">Confirm password:</label>
        <div className="col-sm-8">
        <input type="password" id="inputConfPass" className="form-control" placeholder={confirmPassword} required onChange={(e) => setConfirmPassword(e.target.value)}/>
        </div>
      </div>
      <button type="submit" className="btn btn-outline-success" 
              onClick={(e) => {onLogin(login, password, nick)
                               e.preventDefault()}}
        disabled={(nick.length && login.length && password.length > 1 ? false : true) || (password === confirmPassword ? false : true)}>
        Sign Up
      </button>
    </form>
  );
};

const LoginForm = ({onLogin}) => {
  const [login, setLogin]       = useState('')
  const [password, setPassword] = useState('')
  return (
      <form className='m-auto p-5 w-50 text-center bg-light'>
        <div className="m-1">
          <label className="form-label">Not Email address:
            <input type="text" className="form-control" value={login} onChange={e => setLogin(e.target.value)}/>
          </label>
        </div>
        <div className="mb-1">
          <label className="form-label">Password:
            <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)}/>
          </label>
        </div>
        <button type="submit" className="btn btn-outline-success" onClick={(e) => 
                                                              {onLogin(login, password);
                                                              e.preventDefault()}}>Login</button>
    </form>
  )
}

const CUserInfo = connect(state => ({children: state.user?.userProfile?.payload?.nick || 'me', to:"/dashboard"}))(Link)
const CBtnLogin= connect(state => ({children: 'Login...',  disabled: state.auth.token}), {onClick: () => {alert("Go to LoginForm")}})('button')
const CLoginForm = connect(null, {onLogin: actionFullLogin,  to:"/login"})(LoginForm)
const CRegisterForm = connect(null, { onLogin: actionFullRegister, to:"/registration"})(RegisterForm);
const CLogout   = connect(state => ({children: 'Logout', disabled: !state.auth.token}), {onClick: actionAuthLogout})("button")

const Header = () =>
    <header>
        <CUserInfo />
        <CBtnLogin />
        <CLogout />
    </header>

const HomePage = () =>
    <div>
        Advertisement cards...
    </div>

const App = () =>
<Router history={history}>
  <Provider store={store}>
      <Header />
      <Route path="/login" component={CLoginForm} />
      <Route path="/registration" component={CRegisterForm} />
      <Route path="*" component={HomePage} />
  </Provider>
</Router>

export default App;
