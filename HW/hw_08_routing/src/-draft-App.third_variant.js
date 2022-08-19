// HW_08 Routing
// доделать PageGood по аналогии с PageCategory:
// - приконнектить к нему actionGoodById, сделанный по аналогии с actionCategoryById, 
//   используя второй параметр connect (mapDispatchToProps, сопоставление пропсов с экшонкриейторами)
// - приконнектить к нему информацию о товаре из редакса, что бы отрисовать товар с описанием и картинками
// - добавить роут /orders, который рисует все заказы пользователя;

// gql:
// - сделать функцию getGQL, которая возвращает функцию, похожую на текущую gql, 
// однако замыкает url (getGQL принимает url как параметр; gql же более не будет требовать этого параметра)
// - сделать параметр по умолчанию для variables - пустой объект;
// - сделать reject возвращаемого промиса, если с бэкэнда не вернулся JSON с data, зато в JSON есть errors. 
// ошибка с бэка должна попасть error промиса;
// - сделать так, что бы промис-результат gql был без лишних оберток типа data.CategoryFind, 
// data.GoodFindOne и т.п. Пусть результат gql содержит только полезную информацию. 
// Для этого из data извлеките значение первого ключа, как бы он не назывался;

import logo from './logo.svg';
import './App.scss';
import React, { useState, useEffect } from 'react';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { Provider, connect } from 'react-redux';
import { Router, Route, Link, Redirect, Switch, useHistory } from 'react-router-dom';
import { createBrowserHistory } from "history";
const Header = () => {
    return (
        <>
            <div className="welcome">
                <CLogin />
            </div>
            <header className="App-header">
                <Logo />
                <a href='http://shop-roles.node.ed.asmer.org.ua/graphql' target='blank'>GraphQL_HW08</a>
                <LoginForm onLogin={({ login, password }) =>
                    store.dispatch(actionLogin(login, password, "Login")
                    )} />
            </header>
            <Link to="/orders">Show Orders history</Link><br />
        </>
    )
}

const Logo = () => {
    return (
        <img src={logo} className="App-logo" alt="logo" />
    )
}

const LoginForm = ({ onLogin }) => {
    const [login, setLogin] = useState();
    const [password, setPassword] = useState();
    return (
        <form id='loginForm' className='header_form'>
            <label>Login:
                <input id="login"
                    type="text"
                    placeholder='msemerni'
                    onInput={(e) => { setLogin(e.target.value) }}
                />
            </label>
            <label>Password:
                <input type="password"
                    placeholder='123'
                    onInput={(e) => { setPassword(e.target.value) }} />
            </label>
            <div>
                <button type="submit"
                    disabled={((!login || !password) || login.length < 3) && "Ok"}
                    onClick={(e) => {
                        onLogin({ login, password })
                        e.preventDefault()
                    }}
                >Login</button>
                <button type="button"
                    disabled={(!login || !password)}
                    onClick={() => {
                        if (window.confirm("Really want to Logout?")) {
                            localStorage.removeItem("authToken");
                            { setLogin(null) }
                            document.forms['loginForm'].reset();
                            window.location.reload();
                        }
                    }}
                >Logout</button>
                <button type="button"
                    onClick={(e) => {
                        alert("Тут должна быть регистрация");
                    }}
                >Registration</button>
            </div>
        </form>
    )
}

const Loader = () => {
    return (
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

const BACKEND_URL = "http://shop-roles.node.ed.asmer.org.ua/";
const BACKEND_URL_QUERY = `${BACKEND_URL}graphql`;

const getGQL = url =>
    (query, variables = {}) =>
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(localStorage.authToken ? { "Authorization": "Bearer " + localStorage.authToken } : {})
            },
            body: JSON.stringify({ query, variables })
        })
            .then(res => res.json())
            .then((json) => {
                if (json.data) {
                    return Object.values(json.data)[0];
                } else throw new Error(JSON.stringify(json.errors));
            });

const gql = getGQL(BACKEND_URL_QUERY);

const actionLogin = (login, password, promiseName) => {
    const queryPromise = gql(
        `query log($login: String, $password: String) {
            login (login: $login, password: $password)
        }`,
        { login: login, password: password })

    return actionPromise(promiseName, queryPromise)
}

const actionOrdersHistory = () => {
    const queryPromise = gql(
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
    }`
    )

    return actionPromise("promiseAllOrders", queryPromise)
}

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
        console.log("TOKEN:", token);
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
        { status === 'REJECTED' && <><strong>ERROR</strong>: {error}<br /></> }
    }
}

const GoodCard = ({ good: { name, images, _id, price, description } }) => {
    return (
        <div className='goodContainer'>
            <Link to={`/good/${_id}`} className="goodLink">
                <div className="good">
                    <h3>{name}</h3>
                    <p className="price">Price: $<strong>{price}</strong></p>
                    <img className="imgGood" src={`${BACKEND_URL}${images && images[0] && images[0].url}`}
                        alt={name}></img>
                </div>
            </Link>
        </div>
    )
}

const GoodCardDetailed = ({ good: { name, images, _id, price, description } }) => {
    return (
        <div className='goodContainerDetailed'>
            <h3>{name}</h3>
            <p className="price">Price: $<strong>{price}</strong></p>
            <img className="imgGood" src={`${BACKEND_URL}${images && images[0] && images[0].url}`}
                alt={name}></img>
            <p>{description}</p>
            <div className='card_button_container'>
                <button className='card_button'>Buy</button>
            </div>
        </div>
    )
}

const actionAllCategories = () => {
    const queryPromise = gql(
        `query Cats{
                                CategoryFind(query:"[{}]"){
                                  _id
                                   name   
                                }
                              }`
    )

    return actionPromise('allCategories', queryPromise)
}

const actionCategoryById = (_id) => {
    const queryPromise = gql(
        `query catById($query:String){
            CategoryFindOne(query:$query){
            _id name 
                goods{
                    _id name price images{
                        url
                    }
                }
            }
        }`, { query: JSON.stringify([{ _id }]) })

    return actionPromise('categoryById', queryPromise)
}

store.dispatch(actionAllCategories());

const actionGoodById = (_id) => {
    const queryPromise = gql(
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

    return actionPromise('goodById', queryPromise)
}

const history = createBrowserHistory()
console.log(history)

const LeftMenuCategory = ({ category: { _id, name } }) =>
    <li>
        <Link to={`/category/${_id}`}>{name}</Link>
    </li>

const LeftMenu = ({ categories = [], status }) =>
(status === 'PENDING' || !status ? <Loader /> :
    <div className='LeftMenu'>
        <ul>
            {categories.map(category => <LeftMenuCategory category={category} key={category._id} />)}
        </ul>
    </div>)

const PageCategory = ({ match: { params: { _id } }, onIdChange, category }) => {
    useEffect(() => {
        onIdChange(_id)
    }, [_id])
    return (
        category ?
            <div className='PageCategory'>
                <div>
                    <h1>{category.name}</h1>
                    <div>
                        {!!category.goods?.length ? category.goods.map(good => <GoodCard key={good._id} good={good} />) : <>No goods in this category</>}
                    </div>
                </div>
            </div> : <Loader />
    )
}

const PageGood = ({ match: { params: { _id } }, onIdChange, good }) => {
    useEffect(() => {
        onIdChange(_id)
    }, [_id])
    return (
        good ? <GoodCardDetailed key={good._id} good={good} /> : <Loader />
    )
}

const PageOrdersHistory = ({ onIdChange, orders }) => {
    useEffect(() => {
        onIdChange()
    }, [])
    console.log('ORDERS', orders)
    if (localStorage.authToken && localStorage.authToken !== "undefined") {
        let sum = 0;
        return (
            orders ?
                <div className='ordersBox'>
                    <div className='orders'>
                        <ol>
                            {orders.map((order, i) => {
                                console.log("ORDERS:", orders);
                                return (
                                    orders.length ?
                                        <li key={order._id}>
                                            <table className='table_orders'>
                                                <caption><b>Order# {order._id}</b><br />{new Date(+order.createdAt).toLocaleDateString('en-Ru', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false, minute: '2-digit', second: '2-digit' })}</caption>
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
                                        </li> : <>No orders</>
                                )
                            }
                            )}
                        </ol>
                        <p><b>Total: $ {sum}</b></p>
                    </div>
                </div> : <Loader />
        )
    }
}

const CLogin = connect(state => ({
    status: state.Login?.status,
    token: state.Login?.payload,
    error: state.Login?.error}))(ShowLogin);
const CLeftMenu = connect(state => ({
    categories: state.allCategories?.payload,
    status: state.allCategories?.status}))(LeftMenu)
const CPageCategory = connect(state => ({ category: state.categoryById?.payload }), { onIdChange: actionCategoryById })(PageCategory);
const CPageGood = connect(state => ({ good: state.goodById?.payload }), { onIdChange: actionGoodById })(PageGood);
const CPageOrdersHistory = connect(state => ({ orders: state.promiseAllOrders?.payload }), { onIdChange: actionOrdersHistory })(PageOrdersHistory);

const Content = () =>
    <div className='Content'>
        <Route path="/category/:_id" component={CPageCategory} />
        <Route path="/good/:_id" component={CPageGood} />
        <Route path="/orders" component={CPageOrdersHistory} />
    </div>

const App = () => {
    return (
        <Router history={history}>
            <Provider store={store}>
                <div className="App">
                    <Header />
                    <div className='content'>
                        <CLeftMenu />
                        <Content />
                    </div>
                </div>
            </Provider>
        </Router>
    );
}

export default App;

// ///////////////////////////////////////////////////////////////////////
// // const originalFetch = fetch;
// // fetch = (url, params={headers:{}}) => { 
// //     params.headers.Authorization = "Bearer " + localStorage.authToken
// //     return originalFetch(url, params)
// // }
