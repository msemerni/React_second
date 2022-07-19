// 1) сделать заказ товаров через GraphiQL
// 2) допилить функцию gql, что бы она при наличии токена в localStorage.authToken 
//    добавляла заголовок Authorization со значением "Bearer " + токен 
// 3) сделать запрос на существующие заказы, с позициями, количествами, товарами и их картинками
// 4) используя обновленную gql получить промис с результатом этого запроса.
// 5) отдать этот промис в store.dispatch(actionPromise('orders', gql(.................)))
// 6) придумать отображение истории заказов в React
// 7) используя connect соединить историю заказов из redux с компонентом реакт, который рисует историю заказов.

import logo from './logo.svg';
import './App.scss';
import React, { useState } from 'react';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { Provider, connect } from 'react-redux';

const Header = () => {
  return (
    <>
      <div className="welcome">
        <CLogin />
      </div>
      <header className="App-header">
        {/* изменить вывод имени пользователя в зависимости от наличия токена: ?? */}
        {/* {localStorage.authToken ? <p>Hi</p> : <p>Unregistered</p>} */} 
        <Logo/>
        <a href='http://shop-roles.node.ed.asmer.org.ua/graphql' target='blank'>GraphQL</a>
        <LoginForm onLogin={({login, password}) => 
          store.dispatch(queryLogin(login, password, "Login")
          /* изменить вывод имени пользователя в зависимости от наличия токена: ?? */
          // localStorage.authToken ? {store.dispatch(queryLogin(login, password, "Login")} : <p>"Login First"</p>
        )}/>
      </header>
      <button className='buttonShowOrders' onClick={
        ()=>store.dispatch((queryOrders("AllOrders")))
        }>Show orders history</button>
    </>
  )
}

const Logo = () => {
  return (
    <img src={logo} className="App-logo" alt="logo"/>
  )
}

const LoginForm = ({onLogin}) => {
  const [login, setLogin] = useState();
  const [password, setPassword] = useState();
  return (
    <form id='loginForm' className ='header_form'>
      <label>Login: 
        <input id="login" 
               type="text" 
               placeholder='msemerni'
               onInput={(e) => {setLogin(e.target.value)}}
               // не работает что ниже в комментах?:
              //  {login.length >= 3 && style={{backgroundColor: 'lightgreen'}}} />
              //  style={login.length >= 3 ? {backgroundColor: 'lightred'} : {backgroundColor: 'lightgreen'} }
               />
      </label>
      <label>Password: 
        <input type="password"
               placeholder='123'
               onInput={(e) => {setPassword(e.target.value)}}/>
        </label>
      <div>
        <button type="submit" 
                disabled={((!login || !password) || login.length < 3) && "Ok"}
                onClick={(e) => {
                  onLogin({login, password})
                  e.preventDefault()}}
                  >Login</button>
        <button type="button" 
                disabled={(!login || !password)}
                onClick={() => {
                  if(window.confirm("Really want to Logout?")) {
                    localStorage.removeItem("authToken");
                    {setLogin(null)} // задисейблить кнопки и очистить инпуты если Logout ?
                    document.forms['loginForm'].reset();
                    window.location.reload();
                  }
                }}
                >Logout</button>
      </div>
    </form>
  )
}

const Loader = () => {
  return(
    <div className="LoaderContainer">
      <img src={logo} className="Loader" alt="logo" />
    </div>
  )
}

function promiseReducer(state, { type, status, name, payload, error }) {
  if (state === undefined) {
    return {};
  }

  if (type === "PROMISE") {
    return {
      ...state,
      [name]: { status, payload, error }
    }
  }

  return state;
}

const store = createStore(promiseReducer, applyMiddleware(thunk));
store.subscribe(() => console.log(store.getState()));

const actionPending = (name) => ({ type: "PROMISE", status: "PENDING", name });
const actionFulfilled = (name, payload) => ({ type: "PROMISE", status: "FULFILLED", name, payload });
const actionRejected = (name, error) => ({ type: "PROMISE", status: "REJECTED", name, error });

const actionPromise = (name, promise) =>
  async dispatch => {
    dispatch(actionPending(name))
    try {
      const payload = await promise
      dispatch(actionFulfilled(name, payload))
      return payload
    }
    catch (err) {
      dispatch(actionRejected(name, err))
    }
  }

  const gql = (url, query, variables) =>
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(localStorage.authToken ? {"Authorization": "Bearer " + localStorage.authToken} : {})
    },
    body: JSON.stringify({ query, variables })
  })
    .then(res => res.json())
// .then(json => console.log(json))

const BACKEND_URL = "http://shop-roles.node.ed.asmer.org.ua/";
const BACKEND_URL_QUERY = "http://shop-roles.node.ed.asmer.org.ua/graphql";

const queryLogin = (login, password, promiseName) => {
  const queryPromise = gql(BACKEND_URL_QUERY,
    `query log($login: String, $password: String) {
      login (login: $login, password: $password)
    }`,
    { login: login, password: password })

  return actionPromise(promiseName, queryPromise)
}

const queryCatById = (_id, promiseName) => {
  const queryPromise = gql(BACKEND_URL_QUERY,
    `query catById($queryID:String){
      CategoryFindOne(query:$queryID){
        _id 
        name 
        goods{
          _id name price images{
            url            
         }
        }
      }
    }`,
    { queryID: JSON.stringify([{ _id }]) })

  return actionPromise(promiseName, queryPromise)
}

const queryGoodById = (_id, promiseName) => {
  const queryPromise = gql(BACKEND_URL_QUERY,
    `query Good ($queryID: String) {
      GoodFindOne (query: $queryID) {
        _id
        name
        description
        price
        images {
          _id url
        }
        categories {
          _id name
        }
      }
    }`,
    { queryID: JSON.stringify([{ _id }]) })

  return actionPromise(promiseName, queryPromise)
}

const queryOrders = (promiseName) => {
  const queryPromise = gql(BACKEND_URL_QUERY,
    `query Orders {
      OrderFind(query: "[{}]") {
        createdAt
        owner{
          login
        }
        _id total orderGoods {
          count price total good {
            _id name images {
              url
            }
          }
        }
      }
    }`,
    {})

  return actionPromise(promiseName, queryPromise)
}

const catSamsung = queryCatById("62c94990b74e1f5f2ec1a0dc", "CategorySamsung");
const catIPhone = queryCatById("62c9472cb74e1f5f2ec1a0d4", "CategoryIPhone");
const iPhoneX = queryGoodById("62c9472cb74e1f5f2ec1a0d2", "GoodIPhoneX");
const galaxyM52 = queryGoodById("62c94990b74e1f5f2ec1a0db", "GoodGalaxyM52");


store.dispatch((catSamsung));
store.dispatch((catIPhone));
store.dispatch((iPhoneX));
store.dispatch((galaxyM52));

function jwtDecode(tokenFull) {
  try {
    const tokenCentralPart = tokenFull.split(".")[1];
    const parsedToken = JSON.parse(atob(tokenCentralPart));
    return parsedToken;
  } catch (error) {
    return null;
  }
}

const ShowLogin = ({ status, token, error }) => {
  if (status === 'FULFILLED') {

    const parsedToken = jwtDecode(token);

    if (!!store.getState().Login && status === 'FULFILLED') {
      if (!!parsedToken) {
        localStorage.authToken = token;
        return (
          <div className='login'>
            <p>Welcome, <b>{parsedToken.sub.login}</b></p>
          </div>
        )
      } else {
        alert("Wrong login/password") // почему два раза выскакивает алерт?
      }
    }

    {status === 'REJECTED' && <><strong>ERROR</strong>: {error}<br /></>}
  } 
}

const ShowCategory = ({ status, categoryData, error }) => {
  return (
    <div className='categoriesContainer'>
      {status === 'FULFILLED' ?
        <div className='categories'>
          <h3>{categoryData.name}</h3>
          <GoodsList goodsArray={categoryData.goods} />
        </div> : <Loader/>
      }
      {status === 'REJECTED' && <><strong>ERROR</strong>: {error}<br /></>}
    </div>
  )
}

const GoodsList = ({ goodsArray }) => {
  return (
    <ol className='goods'>
      {goodsArray.map(good => <li key={good._id}><strong>{good.name}</strong></li>)}
    </ol>
  )
}

const ShowGood = ({ status, goodInfo, error }) => {
  return (
    <div className='goodContainer'>
      {status === 'FULFILLED' ?
        <div className="good">
          <div>
            <h3>{goodInfo.name}</h3>
            <p className="price">Price: $<strong>{goodInfo.price}</strong></p>
            <img className="imgGood" src={BACKEND_URL + goodInfo.images[0].url}
              alt={goodInfo.name}></img>
            <details className='details'>
              <summary><u><i>Description:</i></u></summary>
              <p>{goodInfo.description}</p>
            </details>
          </div>
          <div className='card_button_container'>
            <button className='card_button'>Buy</button>
          </div>
        </div> : <Loader/>
      }
      {status === 'REJECTED' && <><strong>ERROR</strong>: {error}<br /></>}
    </div>
  )
}

const ShowOrders = ({ status, orders, error }) => {
  if (localStorage.authToken) {
    let sum = 0;
    return (
      <div className='ordersBox'>
        {status === 'FULFILLED' &&
          <div className='orders'>
            <ol>
              {orders.map((order, i) => {
                console.log(order);
                return (
                  <li key={order._id}>
                    <table className='table_orders'>
                      <caption><b>Order# {order._id}</b><br/>{new Date(+order.createdAt).toLocaleDateString('en-Ru',{year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false, minute:'2-digit', second:'2-digit'})}</caption>
                      {console.log(orders)}
                      <thead>
                        <tr>
                        <th>Image</th><th>Name</th><th>Price</th><th>Count</th><th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.orderGoods.map((item) => {
                          sum += item.total;
                          return (
                            <tr key={item.good.name}>
                              <td>
                                <img className="imgGoodOrder" src={BACKEND_URL + item.good.images[0].url}
                                                              alt={item.good.name}>
                                </img>
                              </td>
                              <td>{item.good.name}</td>
                              <td>{`$ ${item.price}`}</td>
                              <td>{item.count}</td>
                              <td>{`$ ${item.total}`}</td>
                            </tr>
                          )
                        }
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th colSpan="5">Total for order: $ {order.total}</th>
                        </tr>
                      </tfoot>
                    </table>
                  </li>
                )
              }
              )}
            </ol>
            <p><b>Total: $ {sum}</b></p>
          </div>
        }
        {status === 'REJECTED' && <><strong>ERROR</strong>: {error}<br /></>}
      </div>
    )
  }
}

const CLogin =  connect(state => ({status: state.CategorySamsung?.status, 
                                  token: state.Login?.payload?.data?.login,
                                   error: state.CategorySamsung?.error}))(ShowLogin);
const CSamsungCategory = connect(state => ({status: state.CategorySamsung?.status, 
                                            categoryData: state.CategorySamsung?.payload?.data?.CategoryFindOne, 
                                            error: state.CategorySamsung?.error}))(ShowCategory);
const CIPhoneCategory = connect(state => ({status: state.CategoryIPhone?.status, 
                                            categoryData: state.CategoryIPhone?.payload?.data?.CategoryFindOne, 
                                            error: state.CategoryIPhone?.error}))(ShowCategory);
const CGalaxyM52 = connect(state => ({status: state.GoodGalaxyM52?.status, 
                                      goodInfo: state.GoodGalaxyM52?.payload?.data?.GoodFindOne, 
                                      error: state.GoodGalaxyM52?.error}))(ShowGood);
const CIPhoneX = connect(state => ({status: state.GoodIPhoneX?.status, 
                                      goodInfo: state.GoodIPhoneX?.payload?.data?.GoodFindOne, 
                                      error: state.GoodIPhoneX?.error}))(ShowGood);
const CShowOrders = connect(state => ({status: state.AllOrders?.status, 
                                      orders: state.AllOrders?.payload?.data?.OrderFind, 
                                      error: state.AllOrders?.error}))(ShowOrders);

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <Header />
        <CShowOrders />
        <div className='content'>
          <CSamsungCategory />
          <CIPhoneCategory />
          <CGalaxyM52 />
          <CIPhoneX />
        </div>
      </div>
    </Provider>
  );
}

export default App;
