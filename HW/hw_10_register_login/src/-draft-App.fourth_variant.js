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
      //попытаться отправить в редьюсер AUTH_LOGIN
      const oldState = getState().auth
      dispatch({type: 'AUTH_LOGIN', token})
      const newState = getState().auth
      //посмотреть, редьюсеру token зашел или нет
      //если зашел - сохранить токен в localStorage
      if (newState !== oldState){
          localStorage.authToken = token
          store.dispatch(actionUser(store.getState().auth.payload.sub.id)); //????????
      }        
  }

const actionFullLogin = (login, password) =>
  async (dispatch) => {
      //тут надо задиспатчить промис логина
      const gqlQuery = `query log($login:String, $password:String){
          login(login:$login, password:$password)
      }`
      const gqlPromise = gql(gqlQuery, {login, password})
      const action     = actionPromise('login', gqlPromise) 
      // console.log('ща будет PENDING')
      const result     = await dispatch(action) //тут мы получаем токен
      console.log("RESULT_:", result);
      console.log('ща был FULFILLED')
      
      dispatch(actionAuthLogin(result))
      // console.log('ТОКА ШО ОТДАЛ В AUTH REDUCER')
  }

  const actionAuthLogout = () => 
  (dispatch) => {        
      dispatch({type: 'AUTH_LOGOUT'})
      localStorage.removeItem('authToken')
      store.dispatch(actionUser({}))          // ???????????????

      ///////////////////////////
      // store.dispatch(actionUser(store.getState().auth.payload.sub.id));
      // store.user = {}
      // state.user?.userProfile?.payload?.nick
      // state.user = null;
      ///////////////////////////
  }

  const actionFullRegister = (login, password, nick) => 
    async (dispatch) => {
      const gqlQuery = `mutation Register($login: String, $password: String, $nick: String) {
        UserUpsert(user: {login: $login, password: $password, nick: $nick}) {
          _id login nick
        }
      }`;
      const gqlPromise = gql(gqlQuery, { login, password, nick});
      console.log("gqlPromise>>>>>", gqlPromise);

      const action = actionPromise("register", gqlPromise);
      console.log("ща будет PENDING");
      console.log("action>>>>>", action);

      const result = await dispatch(action); //тут мы получаем токен
      console.log("result>>>>>", result);
      if (result) {
        await dispatch(actionFullLogin(login, password));
      }
    };

// const meID = "62eafc06b74e1f5f2ec1a18d";

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
  // store.dispatch(actionUser(store.getState().auth.payload.sub.id)); /// ??????

}

store.subscribe(() => console.log(store.getState()))

const history = createBrowserHistory()
console.log(history)

// const BtnLogin = () => {
//   return(
//     !localStorage.authToken && <button>Login</button>
//   )
// }


/////////////////////

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
      /* <form className='mb-3'>
          <input value={login} onChange={e => setLogin(e.target.value)}/>
          <input value={password} onChange={e => setPassword(e.target.value)}/>
          <button className='btn btn-primary' onClick={() => onLogin(login, password)}>Login</button>
      </form> */
  )
}


// const actionAllAds = () => {
//     const gqlQuery = `query FindAllAds {
//         AdFind (query: "[{}]") {
//           _id title price description images {
//             url
//           }
//         }
//       }`;
//     const gqlPromise = gql(gqlQuery)
//     return actionPromise("allAds", gqlPromise);
//   }
// store.dispatch(actionAllAds) 


// const Button = (class_name) => {
//   return(
//     <button className={class_name}></button>
//   )
// }
//////////////////////////////////////////////////////

// // const CUserInfo = connect(state => ({children: state.auth.payload?.sub.login || 'anon', to:"/dashboard"}))(Link)
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
        Home page...
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


//////////////////////////////////////////////////////////////////////////////////////////////

// const Header = () => {
//   return (
//     <>
//       <div className="welcome">
//         <CLogin />
//       </div>
//       <header className="App-header">
//         <Logo/>
//         <a href='http://shop-roles.node.ed.asmer.org.ua/graphql' target='blank'>GraphQL_HW_10</a>
//         <LoginForm onLogin={({login, password}) => 
//           store.dispatch(actionLogin(login, password, "Login")
//         )}/>
//       </header>
//     </>
//   )
// }

// const Logo = () => {
//   return (
//     <img src={logo} className="App-logo" alt="logo"/>
//   )
// }

// const LoginForm = ({onLogin}) => {
//   const [login, setLogin] = useState();
//   const [password, setPassword] = useState();
//   return (
//     <form id='loginForm' className ='header_form'>
//       <label>Login: 
//         <input id="login" 
//                type="text" 
//                placeholder='msemerni'
//                onInput={(e) => {setLogin(e.target.value)}}
//                />
//       </label>
//       <label>Password: 
//         <input type="password"
//                placeholder='123'
//                onInput={(e) => {setPassword(e.target.value)}}/>
//         </label>
//       <div>
//         <button type="submit" 
//                 disabled={((!login || !password) || login.length < 3) && "Ok"}
//                 onClick={(e) => {
//                   onLogin({login, password})
//                   e.preventDefault()
//                   console.log(localStorage.authToken)}}
//                   >Login</button>
//         <button type="button" 
//                 disabled={localStorage.authToken === "undefined"}
//                 onClick={() => {
//                   if(window.confirm("Really want to Logout?")) {
//                     localStorage.removeItem("authToken");
//                     {setLogin(null)} // задисейблить кнопки и очистить инпуты если Logout ?
//                     document.forms['loginForm'].reset();
//                     window.location.reload();
//                   }
//                 }}
//                 >Logout</button>
//         <button type="button" 
//                 onClick={(e) => {
//                   alert("Тут должна быть регистрация");
//                 }}
//                 >Registration</button>
//       </div>
//     </form>
//   )
// }

// const Loader = () => {
//   return(
//     <div className="LoaderContainer">
//       <img src={logo} className="Loader" alt="logo" />
//     </div>
//   )
// }

// function promiseReducer(state, { type, status, name, payload, error }) {
//   if (state === undefined) {
//     return {};
//   }

//   if (type === "PROMISE") {
//     return {
//       ...state,
//       [name]: { status, payload, error }
//     }
//   }

//   return state;
// }

// const store = createStore(promiseReducer, applyMiddleware(thunk));
// store.subscribe(() => console.log(store.getState()));

// const actionPending = (name) => ({ type: "PROMISE", status: "PENDING", name });
// const actionFulfilled = (name, payload) => ({ type: "PROMISE", status: "FULFILLED", name, payload });
// const actionRejected = (name, error) => ({ type: "PROMISE", status: "REJECTED", name, error });

// const actionPromise = (name, promise) =>
//   async dispatch => {
//     dispatch(actionPending(name))
//     try {
//       const payload = await promise
//       dispatch(actionFulfilled(name, payload))
//       return payload
//     }
//     catch (err) {
//       dispatch(actionRejected(name, err))
//     }
//   }

// const BACKEND_URL = "http://shop-roles.node.ed.asmer.org.ua/";
// const BACKEND_URL_QUERY = `${BACKEND_URL}graphql`;

// const getGQL = url => 
//   (query, variables = {}) =>
//     fetch(url, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Accept: 'application/json',
//         ...(localStorage.authToken ? { "Authorization": "Bearer " + localStorage.authToken } : {})
//       },
//       body: JSON.stringify({ query, variables })
//     })
//     .then(res => res.json())
//     .then((json) => {
//       if (json.data) {
//         console.log("DATA: ", json.data);
//         console.log("DATA[0]: ", Object.values(json.data)[0]);
//         return Object.values(json.data)[0];
//       } else throw new Error(JSON.stringify(json.errors));
//     });

// const gql = getGQL(BACKEND_URL_QUERY);

// const actionLogin = (login, password, promiseName) => {
//   const queryPromise = gql(
//     `query log($login: String, $password: String) {
//       login (login: $login, password: $password)
//     }`,
//     { login: login, password: password })

//   return actionPromise(promiseName, queryPromise)
// }


// function jwtDecode(tokenFull) {
//   try {
//     const tokenCentralPart = tokenFull.split(".")[1];
//     const parsedToken = JSON.parse(atob(tokenCentralPart));
//     return parsedToken;
//   } catch (error) {
//     return null;
//   }
// }
 
// const ShowLogin = ({ status, token, error }) => {
//   if (status === 'FULFILLED') {
//     console.log("TOKEN:", token);
//     const parsedToken = jwtDecode(token);

//     if (!!store.getState().Login && status === 'FULFILLED') {
//       if (!!parsedToken) {
//         localStorage.authToken = token;
//         return (
//           <div className='login'>
//             <p>Welcome, <b>{parsedToken.sub.login}</b></p>
//           </div>
//         )
//       } else {
//         alert("Wrong login/password") // почему два раза выскакивает алерт?
//       }
//     }

//     {status === 'REJECTED' && <><strong>ERROR</strong>: {error}<br /></>}
//   } 
// }



// const history = createBrowserHistory()
// console.log(history)



// const CLogin =  connect(state => ({status: state.Login?.status, 
//                                   token: state.Login?.payload,
//                                   error: state.Login?.error}))(ShowLogin);

// const App = () => {
//   return (
//     <Router history={history}>
//       <Provider store={store}>
//         <div className="App">
//           <Header />
//         </div>
//       </Provider>
//     </Router>
//   );
// }

// export default App;

// ///////////////////////////////////////////////////////////////////////
// // const originalFetch = fetch;
// // fetch = (url, params={headers:{}}) => { 
// //     params.headers.Authorization = "Bearer " + localStorage.authToken
// //     return originalFetch(url, params)
// // }

