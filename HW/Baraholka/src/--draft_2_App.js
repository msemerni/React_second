//// Baraholka

import logo from './logo.svg';
import './App.scss';
import React, {useState, useEffect} from 'react';
import {createStore, applyMiddleware, combineReducers} from 'redux';
import thunk from 'redux-thunk';
import {Provider, connect} from 'react-redux';
import {Router, Route, Link, Redirect, Switch, useHistory} from 'react-router-dom';
import {createBrowserHistory} from "history";
import Dropzone from 'react-dropzone';
import {useDropzone} from 'react-dropzone';
import NO_IMAGE from './image/no_img_available.jpg';

const thumbsContainer = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginTop: 16,
  // border: 'dotted 1px'
};

const thumb = {
  display: 'inline-flex',
  borderRadius: 2,
  border: '1px solid #eaeaea',
  marginBottom: 8,
  marginRight: 8,
  width: 100,
  height: 100,
  padding: 4,
  boxSizing: 'border-box'
};

const thumbInner = {
  display: 'flex',
  minWidth: 0,
  overflow: 'hidden'
};

const img = {
  display: 'block',
  width: 'auto',
  height: '100%'
};


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

const BACKEND_URL = `http://marketplace.node.ed.asmer.org.ua/`;
const BACKEND_URL_QUERY = `${BACKEND_URL}graphql`;
const BACKEND_URL_UPLOAD = `${BACKEND_URL}upload`;

const gql = getGQL(`${BACKEND_URL_QUERY}`)

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
      const gqlQuery = `query Login($login: String!, $password: String!) {
        login(login: $login, password: $password)
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

  const actionFullRegister = (login, password) => 
    async (dispatch) => {
      const gqlQuery = `mutation CreateUser($login: String!, $password: String!) {
        createUser(login: $login, password: $password) {
          _id login
        }
      }`;
      const gqlPromise = gql(gqlQuery, { login, password});
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
      _id login nick createdAt phones avatar{
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
const Loader = () => {
  return(
    <div className="LoaderContainer">
      <img src={logo} className="Loader" alt="logo" />
    </div>
  )
}


const RegisterForm = ({ onLogin }) => {
  // const [nick, setNick] = useState("nick name");
  const [login, setLogin] = useState("email");
  const [password, setPassword] = useState("password");
  const [confirmPassword, setConfirmPassword] = useState("confirm password");
  return (
    <form className="mx-auto p-5 w-100 h-100 text-center bg-light">
      <div className="mb-2 row">
        <label htmlFor="inputEmail" className="col-sm-2 col-form-label text-end">Email:</label>
        <div className="col-sm-8">
          <input type="email" id="inputEmail" className="form-control" placeholder={login} required onChange={(e) => setLogin(e.target.value)}/>
        </div>
      </div>
      <div className="mb-2 row">
        <label htmlFor="inputPass" className="col-sm-2 col-form-label text-end">Password:</label>
        <div className="col-sm-8">
        <input type="password" id="inputPass" className="form-control" placeholder={password} required onChange={(e) => setPassword(e.target.value)}/>
        </div>
      </div>
      <div className="mb-2 row">
        <label htmlFor="inputConfPass" className="col-sm-2 col-form-label text-end">Confirm password:</label>
        <div className="col-sm-8">
        <input type="password" id="inputConfPass" className="form-control" placeholder={confirmPassword} required onChange={(e) => setConfirmPassword(e.target.value)}/>
        </div>
      </div>
      <button type="submit" className="btn btn-outline-success" 
              onClick={(e) => {onLogin(login, password)
                               e.preventDefault()}}
        disabled={(login.length && password.length > 1 ? false : true) || (password === confirmPassword ? false : true)}>
        Sign Up
      </button>
    </form>
  );
};

const LoginForm = ({onLogin}) => {
  const [login, setLogin]       = useState()
  const [password, setPassword] = useState()
  return (
      <form className='m-auto p-5 w-100 h-100 text-center bg-light'>
        <div className="m-1">
          <label className="form-label">Email:
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
                                                              store.dispatch(actionAllAds())
                                                              e.preventDefault()}}>Login</button>
    </form>
  )
}


const actionAllAds = () => {
    const gqlQuery = `query FindAllAds {
      AdFind (query: "[{}]") {
        _id title price description createdAt images {
          _id url
        }
      }
    }
    `;
    const gqlPromise = gql(gqlQuery)
    return actionPromise("allAds", gqlPromise);
  }


const actionSearchAds = (searchString) => {
  const gqlQuery = gql(`query SearchAds ($query: String) {
    AdFind (query: $query) {
      _id title price description createdAt images {
        _id url
      }
    }
  }`, 
  {query: JSON.stringify(
    [ 
      { $or: [{title: `/${searchString}/`}, {description: `/${searchString}/`} ] },
      { sort: [{title: 1}] } 
    ]
    )
  }
  )
  
  return actionPromise("allAds", gqlQuery);
}


  localStorage.authToken && store.dispatch(actionAllAds()) 





const actionGoodById = (_id) => {
  const queryPromise = gql(
      `query Good ($queryID: String) {
    AdFindOne (query: $queryID) {
      _id
      title
      description
      price
      images {
        _id url
      }
    }
  }`,
  { queryID: JSON.stringify([{ _id }]) })

  return actionPromise('goodById', queryPromise)
}

const actionAddAd = (adTitle, adTags, adDescription, adPrice, adAddress, adImages) => {
  const queryPromise = gql(
      `mutation AddAd ($adTitle: String, $adTags: [String], $adDescription: String, $adPrice: Float, $adAddress: String), $adImages:[ImageInput] {
        AdUpsert (ad: {title: $adTitle, tags: [{$adTags}], description: $adDescription, price: $adPrice, address: $adAddress, images: $adImages})
        {_id title tags description price address images{url}}
      }`,
      { adTitle, adTags, adDescription, adPrice, adAddress, adImages })

  return actionPromise('newAd', queryPromise)
}

function convertSearchStr (searchStr) {
  return searchStr.replaceAll(" ", "|");
}

const SearchAd = () => {
  const [searchStrForQuery, setSearchStr] = useState();
  return (
      <form className="d-flex " role="search" >
          <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search" 
            onChange={(e) => setSearchStr(e.target.value)}/>
          <button className="btn btn-outline-success" type="submit" 
                  onClick={(e)=>{
                    let convertedStr = convertSearchStr(searchStrForQuery);
                    store.dispatch(actionSearchAds(convertedStr))
                    e.preventDefault()
                    }
                  }>Search</button>
      </form>
  )
}

////////////////////////
const actionImgeriesUpload = async (acceptedFiles) => {

  const uploadImg = async (oneImagery) => {

    let myFormData = await new FormData();
    myFormData.append("photo", oneImagery); 

    return fetch(BACKEND_URL_UPLOAD, {
      method: "POST",
      headers: localStorage.authToken ? {Authorization: 'Bearer ' + localStorage.authToken} : {},
      body: myFormData
    })
    .then (res => res.json())
    .then (json => {return json})
  }

  let allUploadedImageries =  await Promise.all(acceptedFiles.map(img => uploadImg(img)))
                                    .then(result => {
                                      return result
                                  });  
  console.log("allUploadedImageries: ", allUploadedImageries);
  return allUploadedImageries; 
}

///////

const Previews = (props) => {
  const [files, setFiles] = useState([]);
  const {getRootProps, getInputProps} = useDropzone({
    accept: {
      'image/*': []
    },
    onDrop: acceptedFiles => {
        setFiles(acceptedFiles.map(file => 
          Object.assign(file, {preview: URL.createObjectURL(file)})
          // console.log(acceptedFiles) // массив выбранных файлов
        
        
        ));
        //// ТУТ ДИСПАТЧИТЬ ЭКШН который отправляет файлы на бэк ??,

        store.dispatch(actionImgeriesUpload(acceptedFiles));

    }
  });

  const thumbs = files.map(file => (
    <div style={thumb} key={file.name}>
      <div style={thumbInner}>
        <img
          src={file.preview}
          style={img}
          // Revoke data uri after image is loaded
          onLoad={() => { URL.revokeObjectURL(file.preview) }}
        />
      </div>
    </div>
  ));

  useEffect(() => {
    // Make sure to revoke the data uris to avoid memory leaks, will run on unmount
    return () => files.forEach(file => URL.revokeObjectURL(file.preview));
  }, []);

  return (
    <section className="container" style={{border: "dashed 1px", width: 50+"%"}}>
      <div {...getRootProps({className: 'dropzone'})}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop imageries here, or click to select from disc</p>
      </div>
      <aside style={thumbsContainer}>
        {thumbs}
      </aside>
    </section>
  );
}


////


const Dashboard  = () => {
  const [title, setTitle] = useState()
  const [description, setDescription] = useState()
  const [price, setPrice] = useState()
  const [address, setAddress] = useState()
  const [tags, setTags] = useState([])
    return (
      <form className='mx-auto p-5 col-12 text-center bg-light'>
        <h5>Add new advertisement</h5>
        <div className="sm m-1">
          <label className="form-label w-50">Title:
            <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)}/>
          </label>
        </div>
        <div className="m-1">
          <label className="form-label w-50">Category(Tags):
            <input type="text" className="form-control" value={tags} onChange={e => setTags(e.target.value)}/>
          </label>
        </div>
        <div className="m-1">
          <label className="form-label w-50">Description:
            <textarea className="form-control" value={description} onChange={e => setDescription(e.target.value)}/>
          </label>
        </div>
        <div className="mb-1">
          <label className="form-label w-50">Price ($):
            <input type="number" className="form-control" value={price} onChange={e => setPrice(e.target.value)}/>
          </label>
        </div>
        <Previews />
        <div className="mb-1">
          <label className="form-label w-50">Address:
            <input type="text" className="form-control" value={address} onChange={e => setAddress(e.target.value)}/>
          </label>
        </div>
        <button type="submit" className="btn btn-outline-success" onClick={(e) => 
                                                              {store.dispatch(actionAddAd(title, tags, description, +price, address));
                                                              e.preventDefault()}}>Add Ad</button>
    </form>
  )
}


const AdsCategory = ({ ad: { _id, title, price, createdAt, images } }) =>
<div className="card mb-3" style={{ maxWidth: 75 + "%", margin: "0 auto", background: "#c5c3ff" }}>
<Link to={`/ads/${_id}`} className="text-decoration-none text-black">
  <div className="row g-0">
    <div className="col-md-4">
    {images && images[0] && images[0].url? 
      <img src={`${BACKEND_URL}${images && images[0] && images[0].url}`} className="img-fluid rounded-start" alt={title}/> :
      <img src={NO_IMAGE} className="img-fluid rounded-start" alt={title}/>}
      
      {/* {console.log(images && images[0] && images[0].url)} */}
    </div>
    <div className="col-md-8">
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-text">$<strong>{price}</strong></p>
        <p className="card-text"><small className="text-muted">{new Date(+createdAt).toLocaleDateString('ru-Ru', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false, minute: '2-digit'})}</small></p>
      </div>
    </div>
  </div>
  </Link>
</div>


const AllAds = ({ads=[], status}) =>
(status === 'PENDING' || !status ? <Loader /> :
<div className="row">
   {ads.map(ad => <AdsCategory ad={ad} key={ad._id}/>)}
</div>)

const CAllAds = connect(state => ({ads: state.user?.allAds?.payload, status: state.user?.allAds?.status}))(AllAds)


const AdCardDetailed = ({ ad: { title, images, price, description, phones } }) => {
  return (
    <div className='card' style={{width: 100+"%"}}>
      <img className="card-img-top" src={`${BACKEND_URL}${images && images[0] && images[0].url}`}
        alt={title}></img>
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-text">Price: $<strong>{price}</strong></p>
        <p>{description}</p>
        <tel>{phones}</tel>
        <div className="text-center"> 
          <button className='btn btn-outline-info'>Write message</button>
        </div>
      </div>
    </div>
  )
}

const PageAd = ({ match: { params: { _id } }, onIdChange, ad }) => {
    useEffect(() => {
        onIdChange(_id)
    }, [_id])
    console.log("AD: ", ad);
    return (
        ad ? <AdCardDetailed key={ad._id} ad={ad} /> : <Loader />
    )
}
const CPageGood = connect(state => ({ ad: state.user?.goodById?.payload }), { onIdChange: actionGoodById })(PageAd);
// const Button = (class_name) => {
//   return(
//     <button className={class_name}></button>
//   )
// }

//////////////////////////////////////////////////////
const BtnLogIn  = ({children}) => {
  return(
    <Link className="text-decoration-none" to="/login">
      <button className="btn btn-outline-primary m-1">{children}</button>
    </Link>
  )
}

// const BtnLogOut  = ({children}) => {
//   return(
//   <button className="btn btn-outline-primary m-1">
//     <Link className="text-decoration-none" to="/login">{children}</Link>
//   </button>
//   )
// }

const BtnSignUp  = ({children}) => {
  return(
    <Link className="text-decoration-none" to="/signup">
      <button className="btn btn-outline-primary m-1">{children}</button>
    </Link>
  )
}

// // const CUserInfo = connect(state => ({children: state.auth.payload?.sub.login || 'anon', to:"/dashboard"}))(Link)
const CUserInfo = connect(state => ({children: state.user?.userProfile?.payload?.login || 'Anonymus', to:"/dashboard"}))(Link)
////const CBtnLogin= connect(state => ({children: 'Login...',  disabled: state.auth.token}), {onClick: () => {alert("Go to LoginForm")}})('button')
//// const CBtnLogin= connect(state => ({children: 'Login...',  disabled: state.auth.token, onClick: history.push("/login")}))('button')
// const CBtnLogin = connect(state => ({children: "Login.....", to:"/login"}))(Link)
const CBtnLogIn = connect(state => ({children: 'LogIn',  disabled: !!state.auth.token}))(BtnLogIn)
const CBtnSignUp = connect(state => ({children: 'SignUp', disabled: state.auth.token}))(BtnSignUp)

const CLoginForm = connect(null, {onLogin: actionFullLogin,  to:"/login"})(LoginForm)
const CRegisterForm = connect(null, { onLogin: actionFullRegister, to:"/signup"})(RegisterForm);
const CBtnLogOut   = connect(state => ({children: 'LogOut', disabled: !state.auth.token, className: "btn btn-outline-primary m-1"}), {onClick: actionAuthLogout})("button")
const CDashboard = connect(null, { onClick: console.log("CDashboard") })(Dashboard);

const Header = () =>
  <header className="bg-dark fixed-top p-2 d-flex flex-column">
    <div className="d-flex flex-row justify-content-between" >
      <div >
        <Link to={`/ads`} className="text-decoration-none text-black">
          <h1 style={{ color: "#0d6efd" }} onClick={() => store.dispatch(actionAllAds())}>
            KupiSlona
          </h1>
        </Link>
      </div>
      <div>
        <CUserInfo />
        <CBtnLogIn />
        <CBtnLogOut />
        <CBtnSignUp />

      </div>
    </div>
    <div>
      <SearchAd />
      {/* {console.log(window.location.pathname)} */}
    </div>
  </header>

  const Page404 = () => {
    return (
      <h1>Page not found</h1>
    )
  }

const Content = () =>
<div className='position-absolute mx-auto' style={{top: 115+"px", left: 0+"px", right: 0+"px", bottom: 0+"px"}}>
  <Switch>
    <Route path="/login" component={CLoginForm} />
    <Route path="/signup" component={CRegisterForm} />
    <Route path="/dashboard" component={CDashboard} />
    <Route path="/ads/:_id" component={CPageGood} />
    <Route path="/ads" component={CAllAds} />
    <Redirect from="/" to="/ads"/>
    <Route path="*" component={Page404} />
  </Switch>
</div>

const App = () =>
<Router history={history}>
  <Provider store={store}>
      <Header />
      <Content/>
  </Provider>
</Router>


export default App;


//////////////////////////////////////////////////////////////////////////////////////////////



