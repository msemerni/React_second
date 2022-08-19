//// login: msemerni
//// password: 123
//
//// login: 1122@mail.ru
//// password: 1122

//// KupiSlona
import logo from './logo.svg';
import './App.scss';
import React, {useState, useEffect} from 'react';
import {createStore, applyMiddleware, combineReducers} from 'redux';
import thunk from 'redux-thunk';
import {Provider, connect} from 'react-redux';
import {Router, Route, Link, Redirect, Switch, useHistory} from 'react-router-dom';
import {createBrowserHistory} from "history";
import Dropzone from 'react-dropzone';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePen, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import NO_IMAGE from './image/no_img_available.jpg';
import NO_IMAGE_AVA from './image/default_ava.jpg';
import LOGO from './image/slon5.png';
import { Button } from 'bootstrap';



const tagList = [
  "Auto",
  "Business services",
  "Mutual Aid",
  "Child's world",
  "House and garden",
  "Animals",
  "Spare parts for transport",
  "Health and beauty",
  "Fashion & style",
  "Real estate",
  "Give for free",
  "Work",
  "Hobby, recreation and sports",
  "Electronics",
 ];
 

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

// const EMAIL_REGEXP = new RegExp(/^\S+@\S+\.\S+/);
const EMAIL_REGEXP = new RegExp(/\w/g);

const PASSWORD_REGEXP = new RegExp(/^\w{3,20}$/g);


const history = createBrowserHistory()

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
          dispatch(actionUser(store.getState().auth.payload.sub.id)); //????????
          history.push("./ads")
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
      dispatch(actionUser({}))          // ???????????????
      store.getState().info = {};
      history.push("/")
      document.location.reload();

      ///////////////////////////
      // store.dispatch(actionUser(store.getState().auth.payload.sub.id));
      // store.info = {}
      // state.info?.userProfile?.payload?.nick
      // state.info = null;
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

const actionUser = (_id) => {
  const gqlQuery = `query UserInfo ($ID: String) {
    UserFindOne (query: $ID) {
      _id login nick createdAt phones addresses avatar{
        _id url originalFileName
      }
    }
  }`;
  const gqlPromise = gql(gqlQuery, {ID: JSON.stringify([{_id}])})
  return actionPromise("userProfile", gqlPromise);
}

const combinedReducers = combineReducers({auth: authReducer,
                                          info: promiseReducer, 
                                        })
const store = createStore(combinedReducers, applyMiddleware(thunk));

if (localStorage.authToken){
  store.dispatch(actionAuthLogin(localStorage.authToken))
}

store.subscribe(() => console.log(store.getState()))

const Loader = () => {
  return(
    <div className="LoaderContainer">
      <img src={logo} className="Loader" alt="logo" />
    </div>
  )
}


const RegisterForm = ({ onLogin }) => {
  const [login, setLogin] = useState("email");
  const [password, setPassword] = useState("password");
  const [confirmPassword, setConfirmPassword] = useState("confirm password");
  return (
    <form className="mx-auto px-5 py-2 w-100 h-100 text-center bg-light">
      <div className="mb-2 row">
        <label htmlFor="inputEmail" className="col-sm-2 col-form-label text-end">Email:</label>
        <div className="col-sm-8">
          <input type="email" id="inputEmail" className="form-control" placeholder='email' required onChange={(e) => setLogin(e.target.value)}/>
        </div>
      </div>
      <div className="mb-2 row">
        <label htmlFor="inputPass" className="col-sm-2 col-form-label text-end">Password:</label>
        <div className="col-sm-8">
        <input type="password" id="inputPass" className="form-control" placeholder='min 3 symbols (A-Za-z_)' required onChange={(e) => setPassword(e.target.value)}/>
        </div>
      </div>
      <div className="mb-2 row">
        <label htmlFor="inputConfPass" className="col-sm-2 col-form-label text-end">Confirm password:</label>
        <div className="col-sm-8">
        <input type="password" id="inputConfPass" className="form-control" placeholder='min 3 symbols (A-Za-z_)' required onChange={(e) => setConfirmPassword(e.target.value)}/>
        </div>
      </div>
      <button type="submit" className="btn btn-outline-success" 
              onClick={(e) => {onLogin(login, password)
                               e.preventDefault()
                              }}
        disabled={(!login || !password) || !login?.match(EMAIL_REGEXP) || !password?.match(PASSWORD_REGEXP) || (password === confirmPassword ? false : true)}>
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
            <input type="email" 
                   required
                   className="form-control"
                   onChange={e => setLogin(e.target.value)}/>
          </label>
        </div>
        <div className="mb-1">
          <label className="form-label">Password:
            <input type="password" 
                   required
                   className="form-control" 
                   onChange={e => setPassword(e.target.value)}/>
          </label>
        </div>
        <button type="submit" className="btn btn-outline-success" 
                disabled={((!login || !password) || !login?.match(EMAIL_REGEXP))}
                onClick={(e) => 
                  {onLogin(login, password);
                  }}>Login
        </button>
    </form>
  )
}

const actionSearchAds = (searchString) => {
  const gqlQuery = gql(`query SearchAds ($query: String) {
    AdFind (query: $query) {
      _id title price description createdAt tags comments {_id text} address owner {_id login} images {_id url}
    }
  }`,
    {
      query: JSON.stringify(
        [
          { $or: [{ title: `/${searchString}/` }, { description: `/${searchString}/` }] },
          { sort: [{ _id: -1 }] }
        ]
      )
    }
  )
  return actionPromise("searchAds", gqlQuery);
}

const actionAdById = (_id) => {
  const queryPromise = gql(
      `query Good ($queryID: String) {
    AdFindOne (query: $queryID) {
      _id title price description createdAt tags comments {_id text} address owner {_id login phones} images {_id url}
    }
  }`,
  { queryID: JSON.stringify([{ _id }]) })

  return actionPromise('goodById', queryPromise)
}

const actionAddAd = (Ad) => 
  async (dispatch) => { 
  const gqlQuery = `mutation CreateAd($Ad: AdInput) {
    AdUpsert(ad: $Ad) {
      _id
    }
  }`;
  const gqlPromise = gql(gqlQuery, { Ad });

  const action = actionPromise('newAd', gqlPromise)
  const resolved = await dispatch(action)   /// resolve
  return resolved;
}

function convertSearchStr (searchStr) {
  return searchStr.replaceAll(" ", "|");
}

const SearchAd = ({onSearchAd}) => {
  useEffect(() => {
    onSearchAd()
  }, [])
  const [searchStrForQuery, setSearchStr] = useState();
  return (
      <form className="d-flex " role="search" >
          <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search" 
            onChange={(e) => setSearchStr(e.target.value)}/>
          <button className="btn btn-outline-success" type="submit" 
                  onClick={(e)=>{
                    e.preventDefault()
                    let convertedStr = convertSearchStr(searchStrForQuery);
                    onSearchAd(convertedStr)
                    history.push("/search");
                    }
                  }>Search</button>
      </form>
  )
}

const CSearchAd = connect(null, {onSearchAd: actionSearchAds})(SearchAd)

const actionImgeriesUpload = (acceptedFiles) => 
  async (dispatch) => {
  const uploadImg = (oneImagery) => {

    const myFormData = new FormData();
    myFormData.append("photo", oneImagery); 

    return fetch(BACKEND_URL_UPLOAD, {
      method: "POST",
      headers: localStorage.authToken ? {Authorization: 'Bearer ' + localStorage.authToken} : {},
      body: myFormData
    })
    .then (res => res.json())
    .then (json => json)
  }
  const allPromiseImg = [];

  for (let i = 0; i < acceptedFiles.length; i++) {
    allPromiseImg.push(uploadImg(acceptedFiles[i]))
    
  }
  const allUploadedImageries = actionPromise("allUploadedImageries", Promise.all(allPromiseImg).then(result => result));  
  await dispatch(allUploadedImageries);

}

const actionAvatarUpload = (acceptedFiles) => 
  async (dispatch) => {
  const uploadImg = (oneImagery) => {

    const myFormData = new FormData();
    myFormData.append("photo", oneImagery); 

    return fetch(BACKEND_URL_UPLOAD, {
      method: "POST",
      headers: localStorage.authToken ? {Authorization: 'Bearer ' + localStorage.authToken} : {},
      body: myFormData
    })
    .then (res => res.json())
    .then (json => json)
  }

  const allPromiseImg = [];

  for (let i = 0; i < acceptedFiles.length; i++) {
    allPromiseImg.push(uploadImg(acceptedFiles[i]))
    
  }
  const allUploadedAvatars = actionPromise("allUploadedAvatars", Promise.all(allPromiseImg).then(result => result));  
  await dispatch(allUploadedAvatars);

}

const BtnMyAds = () => {
  return (
    <Link to={`/myads`} className="text-decoration-none text-black">
      <button className='btn btn-secondary btn-sm'>My Ads</button>
    </Link>
  )
}

const BtnMyProfile = () => {
  return (
    <Link to={`/profile`} className="text-decoration-none text-black">
      <button className='btn btn-dark btn-sm'>User Profile</button>
    </Link>
  )
}

const actionChangeProfile = (myProfile) => 
  async (dispatch) => { 
  const gqlQuery = `mutation ChangeProfile($myProfile: UserInput) {
    UserUpsert(user: $myProfile) {
      _id, createdAt, login, nick, avatar {_id url originalFileName}, phones, addresses
    }
  }`
  const gqlPromise = gql(gqlQuery, { myProfile });

  const action = actionPromise('newProfile', gqlPromise)
  const resolved = await dispatch(action)   /// resolve
  dispatch(actionUser(store.getState().auth.payload.sub.id));
  history.push("./dashboard")
  return resolved; /////////////////////////////////////////////////////// ????????????????????????????????????????????
}

const MyProfile = ({ myProfile: {_id, createdAt, login, nick, avatar, phones, addresses}, 
                     status, newImg, onChangeProfile, onUpdateUserInfo, onUpload}) => {
                      
  useEffect(() => {
    console.log("_id=>>> ", _id);
    console.log("myimg=>>> ", img);
    console.log("newImg=>>> ", newImg);
  }, [])

  useEffect (() => {
    console.log("myimg: ", img);
    console.log("newImg: ", newImg);
    if(newImg) {
      setImg(newImg)
    }
  },[newImg])

  const [myLogin, setMyLogin] = useState(login);
  const [myNick, setMyNick] = useState(nick || "");
  const [myPhones, setMyPhones] = useState(phones || []);
  const [myAddresses, setMyAddresses] = useState(addresses || []);
  const [img, setImg] = useState();

  const changeProfile = () => {
    console.log("beforePUSH_newImg: ", newImg);
    const newAva = {_id: img[0]._id}
    console.log("PUSH_newImg: ", newImg);
 

    const newProfile = {
    _id: _id,
    login: myLogin,
    // ...(myNick ? {nick: myNick} : {}),
    nick: myNick,
    phones: myPhones,
    addresses: myAddresses,
    ...(newAva ? {avatar: newAva} : {}), ///  ко всем применить?
    }

    console.log("newProfile_==++==: ", newProfile);
    console.log("AVATAR_==++==: ", avatar);
    onChangeProfile(newProfile);


    // store.dispatch(onUpdateUserInfo(_id));
    
  }

  return (status === 'PENDING' || !status ? <Loader /> :
  <form className="mx-auto px-5 py-2 w-100 h-100 text-center bg-light">
    <span className="mb-2">Registered: <b>{new Date(+createdAt).toLocaleDateString('ru-Ru', { year: 'numeric', month: '2-digit', day: '2-digit'})}</b></span>
    
    <CPreviewAvatar className="col-md-3 p-1 mx-auto"/>

    <Dropzone onDrop={(acceptedFiles) => { onUpload(acceptedFiles) }}>
          {({ getRootProps, getInputProps }) => (
            <section className="container mx-auto mb-2 col-sm-8" style={{ border: "dashed 1px", width: 65 + "%" }}>
              <div className="text-center p-2" {...getRootProps()}>
                <input {...getInputProps()} />
                <p className='m-0'>Drag 'n' drop avatar here, or click to select</p>
              </div>
            </section>
          )}
    </Dropzone>
    
    <div className="mb-2 row">
      <label htmlFor="inputEmail" className="col-sm-2 col-form-label text-start">Email:</label>
      <div className="col-sm-8">
        <input type="text" id="inputEmail" className="form-control" placeholder='*required'value={myLogin} required /// type=email
               onChange={(e) => setMyLogin(e.target.value)}/>
      </div>
    </div>
    <div className="mb-2 row">
      <label htmlFor="inputNick" className="col-sm-2 col-form-label text-start">Nick:</label>
      <div className="col-sm-8">
        <input type="text" id="inputNick" className="form-control" placeholder='not required'value={myNick} 
               onChange={(e) => setMyNick(e.target.value)}/>
      </div>
    </div>
    <div className="mb-2 row">
      <label htmlFor="inputNick" className="col-sm-2 col-form-label text-start">Phones:</label>
      <div className="col-sm-8">
        <input type="text" id="inputNick" className="form-control" placeholder='not required'value={myPhones} 
               onChange={(e) => setMyPhones(e.target.value)}/>
      </div>
    </div>
    <div className="mb-2 row">
      <label htmlFor="inputNick" className="col-sm-2 col-form-label text-start">Address:</label>
      <div className="col-sm-8">
        <input type="text" id="inputNick" className="form-control" placeholder='not required'value={myAddresses} 
               onChange={(e) => setMyAddresses(e.target.value)}/>
      </div>
    </div>

   <button type="submit" className="btn btn-outline-success" 
              onClick={(e) => {changeProfile();
                               e.preventDefault();
                              //  actionUser(_id);
                              }}
              disabled={(!login) || !login?.match(EMAIL_REGEXP)}>Change profile
   </button>
   </form>
  )
}

const CMyProfile = connect(state => ({myProfile: state.info?.userProfile?.payload, 
                                      status: state.info?.userProfile?.status,
                                      newImg: state.info?.allUploadedAvatars?.payload}), 
                                    {onChangeProfile: actionChangeProfile,
                                      onUpload: actionAvatarUpload
                                    })(MyProfile)

const PreviewAvatar = ({ img = [store.getState().info?.userProfile?.payload?.avatar], status, className }) => {
  useEffect(() => {
  }, [img])
  // console.log("imageriesAVA+: ", img);

  return (status === 'PENDING' ? <Loader /> :
    <div className={`${className}`}>
      {img && img[0] && img[0].url ? 
        <img src={`${BACKEND_URL}${img[0].url}`} className="img-fluid rounded-circle" /> :
        <img src={NO_IMAGE_AVA} className="img-fluid rounded-circle" alt={"avatar.originalFileName"} />
      }
  </div>
)
}
 
const CPreviewAvatar = connect(state => ({img: state.info?.allUploadedAvatars?.payload,
                                          status: state.info?.allUploadedAvatars?.status,}))(PreviewAvatar)

const Dashboard  = ({ newImg, onUpload, onNewAd}) => {
  // const _id = "62fde8f0c1b7470e6a893178";
  const _id = null;   ////////// сделать динамический айди
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState()
  const [address, setAddress] = useState("")
  const [tags, setTags] = useState([])
  const [imgNew, setImg] = useState([])
  
  // useEffect (() => {
  //   console.log("TAGS: ",tags);
  //   console.log("tagsNew: ", tagsNew);
  // },[])

  const addNewAd = () => {
    
    const imgArr = [];

    if (imgNew) {   //// лишнее ??
      for (const i of imgNew) {
        const newImg = {_id: i._id}
        imgArr.push(newImg)
      }
    }

    const newAd = {
      ...(_id ? {_id: _id} : {}),
      ...(imgArr.length ? {images: imgArr[0].url} : {}), /// для аватара
      // ...(imgArr.length ? {images: imgArr} : {}), ///  для объяв
      title: title,
      description: description,
      tags: tags,
      address: address,
      price: +price,
      }

    onNewAd(newAd)
    console.log(newAd);
  }


  useEffect (() => {
    console.log("newImg: ", newImg);
    if(newImg) {
      setImg(newImg)
    }
  },[newImg])

   return (
    <>
      <div className="m-2 d-flex justify-content-between">
        <BtnMyAds/>
        <BtnMyProfile/>
      </div>
      <form className='mx-auto px-5 col-12 text-center bg-light'>

        <h5>Add new/Edit advertisement</h5>

        <div className="mb-1">
          <label className="form-label w-50">Title:
            <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} />
          </label>
        </div>

        <div className="mb-1">
          <label className="form-label w-50">Category(Tags):
            <select className="form-select" defaultValue={"0"} required onChange={e => { setTags(e.target.value) }}>
              <option disabled value="0">Choose category...</option>
              {tagList.map((item) => {
                return (<option key={item}>{item}</option>)
              })}
            </select>
          </label>
        </div>

        <div className="mb-1">
          <label className="form-label w-50">Description:
            <textarea className="form-control" value={description} onChange={e => setDescription(e.target.value)} />
          </label>
        </div>

        <div className="mb-1">
          <label className="form-label w-50">Price ($):
            <input type="number" className="form-control" value={price} onChange={e => setPrice(e.target.value)} />
          </label>
        </div>

        <Dropzone onDrop={(acceptedFiles) => { onUpload(acceptedFiles) }}>
          {({ getRootProps, getInputProps }) => (
            <section className="container" style={{ border: "dashed 1px", width: 50 + "%" }}>
              <div style={{ textAlign: "center" }} {...getRootProps()}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop imageries here, or click to select from disc</p>
              </div>
              {/* <CPreviewUploadImg /> */}
              <div className="d-flex flex-row justify-content-center p-1">
                  {
                    imgNew.map(img => { return <img style={{ display: "flex", width: 50 + "px", margin: 0.5+"em"}} key={img._id} src={`${BACKEND_URL}${img.url}`} /> })
                  }
              </div>
            </section>
          )}
        </Dropzone>


        <div className="mb-1">
          <label className="form-label w-50">Address:
            <input type="text" className="form-control" value={address} onChange={e => setAddress(e.target.value)} />
          </label>
        </div>
        <button type="button" className="btn btn-outline-success" 
                onClick={(e) => {
                         addNewAd()
                         e.preventDefault()
                        }}>Add advertisement</button>
      </form>
    </>
  )
}
const CDashboard = connect(state => ({ newImg: state.info?.allUploadedImageries?.payload, 
                                       adForEdit: state.info?.goodById?.payload}),
  { onUpload: actionImgeriesUpload, onNewAd: actionAddAd})(Dashboard);

// const PreviewUploadImg = ({ img = [], status }) => {
//   useEffect(() => {
//     console.log("imageries: ", img);
//   }, [img])

//   return (status === 'PENDING' ? <Loader /> :
//     <div className="d-flex flex-row justify-content-start">
//       {
//         img.map(img => { return <img style={{ display: "flex", width: 50 + "px" }} key={img._id} src={`${BACKEND_URL}${img.url}`} /> })
//       }
//     </div>

//   )
// }
// const CPreviewUploadImg = connect(state => ({img: state.info?.allUploadedImageries?.payload, 
//                                   status: state.info?.allUploadedImageries?.status}))(PreviewUploadImg)



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// window.onscroll = function(e) {


// window.onscroll = function(e) {
//   let pageHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight,  document.documentElement.clientHeight,  document.documentElement.scrollHeight,  document.documentElement.offsetHeight );
//   if ((window.innerHeight + window.scrollY) >= pageHeight) {
//       console.log("You are at the bottom of the page.");
//   }
// };
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const actionAllAds = () => 
  async (dispatch, getState) => {

    let skipAdsCount;

    const uploadedAds = getState().info?.allAds?.payload || [];
    // console.log("uploadedAds: ", uploadedAds);

    uploadedAds ? skipAdsCount = uploadedAds.length : skipAdsCount = 0;
    // console.log("skipAdsCount: ", skipAdsCount);


    const gqlQuery = await gql(`query SearchAds ($query: String) {
    AdFind (query: $query) {
      _id title price description createdAt tags comments {_id text} address owner {_id login phones addresses} images {_id url}
    }
  }`,
      {
        query: JSON.stringify(
          [
            {},
            {
              sort: [{ _id: -1 }],
              limit: [5],
              skip: [skipAdsCount]
            }
          ]
        )
      }
    )

    const updateAD = await gqlQuery;
    const partOfAds = dispatch(actionFulfilled("allAds", [...uploadedAds, ...updateAD]));  
    // await dispatch(partOfAds);
    //return actionPromise("allAds", gqlQuery);
  }

const AdsCategory = ({ ad: { _id, title, price, createdAt, images } }) =>
  <div className="card mb-3" style={{ maxWidth: 75 + "%", margin: "0 auto", background: "#c5c3ff" }}>
    <Link to={`/ads/${_id}`} className="text-decoration-none text-black">
      <div className="row g-0">
        <div className="col-md-4">
          {images && images[0] && images[0].url ? <img src={`${BACKEND_URL}${images && images[0] && images[0].url}`} 
          className="img-fluid rounded-start" alt={title} /> : <img src={NO_IMAGE} className="img-fluid rounded-start" alt={title} />}
        </div>
        <div className="col-md-8">
          <div className="card-body">
            <h3 className="card-title">{title}</h3>
            {price > 0 && <p className="card-text">$<strong>{price}</strong></p>}
            <p className="card-text"><small className="text-muted">{new Date(+createdAt).toLocaleDateString('ru-Ru', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false, minute: '2-digit' })}</small></p>
          </div>
        </div>
      </div>
    </Link>
  </div>


const actionClearAd = () => 
async (dispatch) => {
  await dispatch(actionFulfilled("allAds", [])); 
}

const AllAds = ({ ads = [], status, onAllAd, onClearAd }) => {



  useEffect(()=>{
     window.onscroll = function (e) {
      if(e.target.documentElement.scrollHeight - (e.target.documentElement.scrollTop + window.innerHeight) < 1){
          console.log("you're at the bottom of the page")
          onAllAd();
      }
    }
    onAllAd();
    return () => {
      window.onscroll = 0;
      onClearAd();
      
    }
    },[])


  return (status !== 'FULFILLED' ? <Loader /> :
    <div className="row m-0">
      {
        ads.map(ad => <AdsCategory ad={ad} key={ad._id}/>)
      }
    </div>
  )
}

const CAllAds = connect(state => ({ads: state.info?.allAds?.payload, 
                                        status: state.info?.allAds?.status}), 
                                 {onAllAd: actionAllAds, onClearAd: actionClearAd})(AllAds)

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const actionMyAds = (ownerID) => {
  const gqlQuery = gql(
    `query SearchMyAds ($queryID: String) {
      AdFind (query: $queryID) {
        _id title price description createdAt tags comments {_id text} address owner {_id login} images {_id url}
    }
  }`,
    {
      queryID: JSON.stringify(
        [{___owner: ownerID}, {sort: [{_id: -1}]}]
      )
    }
  )
  return actionPromise("myAds", gqlQuery);
}

const MyAds = ({ ads = [], status, ownerID, onMyAds}) => {
  useEffect(() => {
    onMyAds(ownerID)
  }, [ownerID])
  return (status === 'PENDING' || !status ? <Loader /> :
    <div className="row">
      {
        ads.map(ad => <AdsCategory ad={ad} key={ad._id}/>)
      }
    </div>
  )
}

const CMyAds = connect(state => ({ads: state.info?.myAds?.payload, 
                                       status: state.info?.myAds?.status,
                                       ownerID: state.auth?.payload?.sub?.id}), 
                                {onMyAds: actionMyAds})(MyAds)

const SearchAds = ({ ads = [], status}) => {
  return (status === 'PENDING' || !status ? <Loader /> :
    <div className="row">
      {
        ads.map(ad => <AdsCategory ad={ad} key={ad._id}/>)
      }
    </div>
  )
}

const CSearchAds = connect(state => ({ads: state.info?.searchAds?.payload, 
                                           status: state.info?.searchAds?.status}), 
                                    {actionSearchAds})(SearchAds)

const SliderImageries = ({ imgArray }) => {
  console.log("imgArray::: ", imgArray);
  return (
    imgArray[0] && 
    <div id="carouselExampleControls" className="carousel slide w-75 mx-auto" data-bs-ride="carousel">
      <div className="carousel-inner">
        {imgArray.map((img, index) =>
          index === 0 ?
            <div key={img._id} className="carousel-item active">
              <img className="d-block w-100 rounded " alt="picture" src={`${BACKEND_URL}${img.url}`} />
            </div> :
            <div key={img._id} className="carousel-item">
              <img className="d-block w-100 rounded " alt="picture" src={`${BACKEND_URL}${img.url}`} />
            </div>
        )}
        </div>
      <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleControls" data-bs-slide="prev">
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Previous</span>
      </button>
      <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleControls" data-bs-slide="next">
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Next</span>
      </button>
    </div>
  )
}

const AdCardDetailed = ({ ad: { title, images, price, description, address, owner: {phones} } }) => {
  console.log(images);
  return (
    <div className='card' style={{width: 100+"%"}}>
      {images && <SliderImageries imgArray={images}/>}
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-text">Price: $<strong>{price}</strong></p>
        <p>{description}</p>
        <address>{address}</address>
        <p>{phones}</p>

        {store.getState().info.userProfile?.payload?._id !== store.getState().info.goodById?.payload?.owner?._id &&
        <div className="text-center"> 
          <button className='btn btn-outline-info' onClick={() => alert("Write your message from Telegram/Viber")}>Write message</button>
        </div> 
        }
      </div>

      {store.getState().info.userProfile?.payload?._id === store.getState().info.goodById?.payload?.owner?._id && 
          <div className="d-flex justify-content-end">
            <Link to={`/dashboard`}>
              <FontAwesomeIcon icon={faFilePen} style={{padding: 0.5+"em", fontSize: 2+"em"}}/>
            </Link>
              <FontAwesomeIcon  icon={faTrashCan}
                                style={{padding: 0.5+"em", fontSize: 2+"em", color: "#dc3545", cursor: "pointer"}} 
                                onClick={() => alert("Advertisement deleted")}/>
          </div>
        }
        
    </div>
  )
}

const PageAds = ({ match: { params: { _id } }, onIdChange, ad }) => {
    useEffect(() => {
        onIdChange(_id)
    }, [_id])
    console.log("AD: ", ad);
    return (
        ad ? <AdCardDetailed key={ad._id} ad={ad} /> : <Loader />
    )
}
const CPageAds = connect(state => ({ ad: state.info?.goodById?.payload }), { onIdChange: actionAdById })(PageAds);

const BtnLogIn  = ({children}) => {
  return(
    <Link className="text-decoration-none" to="/login">
      <button className="btn btn-outline-primary m-1 btn-sm">{children}</button>
    </Link>
  )
}

const BtnSignUp  = ({children}) => {
  return(
    <Link className="text-decoration-none" to="/signup">
      <button className="btn btn-outline-primary m-1 btn-sm">{children}</button>
    </Link>
  )
}

const CUserInfo = connect(state => ({children: state.info?.userProfile?.payload?.nick, className: "mx-2" || state.info?.userProfile?.payload?.login, to:"/dashboard"}))(Link)
const CBtnLogIn = connect(state => ({children: 'LogIn',  disabled: !!state.auth.token}))(BtnLogIn)
const CBtnSignUp = connect(state => ({children: 'SignUp', disabled: state.auth.token}))(BtnSignUp)
const CLoginForm = connect(null, {onLogin: actionFullLogin,  to:"/ads"})(LoginForm)
const CRegisterForm = connect(null, { onLogin: actionFullRegister, to:"/signup"})(RegisterForm);
const CBtnLogOut   = connect(state => ({children: 'LogOut', disabled: !state.auth.token, className: "btn btn-outline-primary m-1 btn-sm"}), {onClick: actionAuthLogout})("button")

const Avatar = ({ avatar, status, className }) => {
  useEffect(() => {
    console.log("++AVA++: ", avatar);
  }, [avatar])

  if(status === 'FULFILLED') {
    return (status === 'PENDING' ? <Loader /> :
    <div style={{maxWidth: 40+"px"}}>
      {avatar && avatar.url ? 
        <img src={`${BACKEND_URL}${avatar.url}`} className={`${className}`} alt={"avatar"}/> :
        <img src={NO_IMAGE_AVA} className={`${className}`} alt={"avatar"} />
      }
  </div>
  )
  }
}

const CAvatar = connect(state => ({avatar: state.info?.userProfile?.payload?.avatar,
                                  status: state.info?.userProfile?.status,
                                  className: "img-fluid rounded-circle"
                                }))(Avatar)

const Logo = () => {
  return(
    <div className="me-1" style={{maxWidth: 40+"px"}}>
      <img src={LOGO} className="img-fluid" alt={"logo"} />
  </div>
  ) 
}

const Header = () =>
  <header className="header bg-dark fixed-top p-2 d-flex flex-column">
    <div className="d-flex flex-row justify-content-between mb-1" >
      <div className="d-flex align-items-center">
        <Link to={`/ads`} className="text-decoration-none text-black d-flex align-items-center">
          <Logo/>
          <h1 className="fw-bolder"style={{ color: "#0d6efd" }} >
            KupiSlona
          </h1>
        </Link>
      </div>
      <div className="d-flex justify-content-end align-items-center">
        <CAvatar className="col-md-1 p-1"/>
        <CUserInfo />
        {!localStorage.authToken ? (<><CBtnLogIn /> <CBtnSignUp /></>) : <CBtnLogOut />}
      </div>
    </div>
    <div>
      {<CSearchAd />}
    </div>
  </header>

  const Page404 = () => {
    return (
      <h1>Page not found</h1>
    )
  }

const Content = () =>
<div className='position-absolute mx-auto' style={{top: 125+"px", left: 0+"px", right: 0+"px", bottom: 0+"px"}}>
  <Switch>
    <Route path="/login" component={CLoginForm} />
    <Route path="/signup" component={CRegisterForm} />
    <Route path="/dashboard" component={CDashboard} />
    <Route path="/ads/:_id" component={CPageAds} />
    <Route path="/ads" component={CAllAds} />
    <Route path="/search" component={CSearchAds} />
    <Route path="/myads" component={CMyAds} />
    <Route path="/profile" component={CMyProfile} />
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
