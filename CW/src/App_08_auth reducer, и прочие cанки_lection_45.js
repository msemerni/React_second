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

function stubReducer(state, {type}){
    if (state === undefined){
        return {counter: 0}
    }
    if (type === 'COUNTER++'){
        return {counter: state.counter +1}
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
        }        
    }

const actionAuthLogout = () => 
    (dispatch) => {        
        dispatch({type: 'AUTH_LOGOUT'})
        localStorage.removeItem('authToken')
    }

const actionFullLogin = (login, password) =>
    async (dispatch) => {
        //тут надо задиспатчить промис логина
        const gqlQuery = `query log($login:String, $password:String){
            login(login:$login, password:$password)
        }`
        const gqlPromise = gql(gqlQuery, {login, password})
        const action     = actionPromise('login', gqlPromise) 
        console.log('ща будет PENDING')
        const result     = await dispatch(action) //тут мы получаем токен
        console.log('ща был FULFILLED')

        dispatch(actionAuthLogin(result))
        console.log('ТОКА ШО ОТДАЛ В AUTH REDUCER')
    }


const combinedReducers = combineReducers({promise: promiseReducer, 
                                          auth:   authReducer})

const store = createStore(combinedReducers, applyMiddleware(thunk))
if (localStorage.authToken){
    store.dispatch(actionAuthLogin(localStorage.authToken))
}

//store.dispatch(actionFullLogin('test456', '123123'))
//console.log(store)
store.subscribe(() => console.log(store.getState()))


const actionAllCategories = () =>{
    const queryPromise = gql(`
                                    query Cats{
                                          CategoryFind(query:"[{}]"){
                                                _id
                                            name    
                                          }
                            }`, {})
    return actionPromise('allCategories', queryPromise)
}

const actionCategoryById = (_id) =>  {
    const queryPromise = gql( `
        query catById($query:String){
            CategoryFindOne(query:$query){
            _id name 
                goods{
              _id name price images{
                url
              }
            }
          }
        }`, {query: JSON.stringify([{_id}])})

    return actionPromise('categoryById', queryPromise)
}


store.dispatch(actionAllCategories())
const actionCounterInc = () => ({type:'COUNTER++'})

//store.dispatch(actionCounterInc())
//setTimeout(() => store.dispatch(actionCounterInc()), 5000)
//
//const mapStateToProps = state => ({children: state.stub.counter})
//const mapDispatchToProps = {onClick: actionCounterInc}

//const ReduxCounterButton = () => {
       //const [reduxState, setReduxState] = useState(mapStateToProps(store.getState()))
    //useEffect(() => { //всегда надо сделать подписку вначале жизни компонента
        //const unsubscribe = store.subscribe(() => { 
            //setReduxState(mapStateToProps(store.getState())) //тут такой же путь .stub.counter
            //console.log('redux обнова')
        //})
        //return () => { //....и отписку вконце
            //unsubscribe()
        //}
    //},[])
    //console.log(reduxState)
    ////всегда на обработку событий вешается какой-то actionCreator и его результат (объект-action) 
    ////отправляется в store.dispatch
    //return <CounterButton onClick={() => store.dispatch(mapDispatchToProps.onClick())} {...reduxState}/>
//} //всегда нужен какой-то там useState, и какой-то путь в redux типа .stub.counter


//const CounterButton = ({children, onClick}) =>
//<button onClick={onClick}>
    //{children} 
//</button>

//const CCounterButton = connect(mapStateToProps, mapDispatchToProps)(CounterButton)

//const connector  = connect(mapStateToProps, mapDispatchToProps)
//const CDiv       = connector('div')
//const CSpan      = connector('span')
//const CCounterButton2 = connector(CounterButton)

//const About = ({match}) =>
//<div>
    //<pre>{JSON.stringify(match, null, 4)}</pre>
    //<h1>About</h1>
    //blah-blah about us
//</div>

//const Add = ({match:{params:{a,b}}}) =>{ 
    //let history = useHistory()
    //console.log('HIST', history)
    //return (
        //<div>
            //<h1>Add</h1>
            //blah-blah about us
            //<div>a + b = {a} + {b} = {+a + +b}</div>
        //</div>)
//}

//const Contact = () =>
//<div>
    //<h1>Contacts</h1>
    //phone 1<br/>
    //phone 2
//</div>

//const Page404 = () =>
//<div>
    //<h1>404</h1>
//</div>

const history = createBrowserHistory()

console.log(history)

//function App() {
    //const [show, setShow] = useState(true)
    //const [ms, setMS] = useState(2000)
    //const [counters, setCounters] = useState([])
    //console.log(counters)
    //return (
        //<Router history = {history}>
            //Ниже будут куски верстки(т. е. компоненты) в зависимости от адреса<br/>
            //<Link to="/about">About</Link>
            //<Switch>
                //<Route path="/about" component={About} />
                //<Redirect from="/aboutus" to="/about"/>
                //<Route path="/add/:a/:b" component={Add} />
                //<Route path="/contact" component={Contact} />
                //<Route path="*" component={Page404} />
            //</Switch>
            //<Link to="/contact">Contact</Link><br/>
            //<Link to="/add/2/2">2 + 2</Link><br/>
            //<Link to="/add/5/15">5 + 15</Link>
            //Выше будут куски верстки(т. е. компоненты) в зависимости от адреса
        //</Router>
    //);
//}


const LeftMenuCategory = ({category: {_id, name}})=>
<li>
    <Link to={`/category/${_id}`}>{name}</Link>
</li>

const LeftMenu = ({categories=[], status}) =>
(status === 'PENDING' || !status ? <>LOADING</> :
<div className='LeftMenu'>
    <ul>
        {categories.map(category => <LeftMenuCategory category={category} key={category._id}/>)}
    </ul>
</div>)

const CLeftMenu = connect(state => ({categories: state.promise.allCategories?.payload, 
                                     status: state.promise.allCategories?.status}))(LeftMenu)

const GoodCard = ({good:{name, images, _id, price}}) => 
<Link to={`/good/${_id}`} className="GoodCard">
    <h2>{name}</h2>
    <img src={`${URL}${images && images[0] && images[0].url}`} />
    <span className="Price">{price}</span>
</Link>


const PageCategory = ({match: {params: {_id}}, onIdChange, category}) => {
    useEffect(() => {
        onIdChange(_id)
    },[_id])
    console.log('PAGE CATEGORY', category)
    return (
        category ? 
        <div className='PageCategory'>
            <h1>{category.name}</h1>
            <div>
            {!!category.goods?.length ? category.goods.map(good => <GoodCard key={good._id} good={good}/>) : <>No goods in this category</>}
            </div>
        </div> : <>Loading</>
    )
}

const CPageCategory = connect(state => ({category: state.promise.categoryById?.payload}), {onIdChange: actionCategoryById})(PageCategory)

const PageGood = ({match: {params: {_id}}}) =>
<div>
    <h1>Тут будет товар с _id: {_id}</h1>
</div>

const Content = () =>
<div className='Content'>
    <Route path="/category/:_id" component={CPageCategory} />
    <Route path="/good/:_id" component={PageGood} />
</div>

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOnsiaWQiOiI2MmQ5ODlmMWI3NGUxZjVmMmVjMWExNjAiLCJsb2dpbiI6InRlc3Q0NTYiLCJhY2wiOlsiNjJkOTg5ZjFiNzRlMWY1ZjJlYzFhMTYwIiwidXNlciJdfSwiaWF0IjoxNjU4NTExNjU3fQ._NPVmWbGmGgA77kXqAEMMm7IrzVA_hgesp3Czq1VC9M"

const CUserName = connect(state => ({children: state.auth.payload?.sub.login || 'anon', to:"/dashboard"}))(Link)
const CLogout   = connect(state => ({children: 'Logout', disabled: !state.auth.token}), {onClick: actionAuthLogout})('button')
const CTestLogin= connect(state => ({children: 'Login',  disabled: state.auth.token}), {onClick: () => actionAuthLogin(token)})('button')


const Header = () =>
<header>
    <CUserName />
    <CLogout />
    <CTestLogin />
</header>

const LoginForm = ({onLogin}) => {
    const [login, setLogin]       = useState('')
    const [password, setPassword] = useState('')
    return (
        <div className='LoginForm'>
            <input value={login} onChange={e => setLogin(e.target.value)}/>
            <input value={password} onChange={e => setPassword(e.target.value)}/>
            <button onClick={() => onLogin(login, password)}>Login...</button>
        </div>
    )
}

const CLoginForm = connect(null, {onLogin: actionFullLogin})(LoginForm)


const App = () =>
<Router history={history}>
    <Provider store={store}>
        <Header />
        <CLeftMenu />
        <Content />
        <CLoginForm />
    </Provider>
</Router>


export default App;
