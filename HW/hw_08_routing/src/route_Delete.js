import logo from './logo.svg';
import './App.scss';
import React, {useState, useEffect} from 'react';
import {createStore, applyMiddleware} from 'redux';
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

let gql = (url, query, variables) =>
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify({query, variables})
    })
    .then(res => res.json())

const store = createStore(promiseReducer, applyMiddleware(thunk))
store.subscribe(() => console.log(store.getState()))

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

const actionAllCategories = () =>{
    const queryPromise = gql(`http://shop-roles.node.ed.asmer.org.ua/graphql`, `
                                    query Cats{
                                          CategoryFind(query:"[{}]"){
                                                _id
                                            name    
                                          }
                            }`, {})
    return actionPromise('allCategories', queryPromise)
}

const actionCategoryById = (_id) =>  {
    const queryPromise = gql(`http://shop-roles.node.ed.asmer.org.ua/graphql`, `
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

const CLeftMenu = connect(state => ({categories: state.allCategories?.payload?.data?.CategoryFind, 
                                     status: state.allCategories?.status}))(LeftMenu)

const GoodCard = ({good:{name, images, _id, price}}) => 
<Link to={`/good/${_id}`} className="GoodCard">
    <h2>{name}</h2>
    <img src={`http://shop-roles.node.ed.asmer.org.ua/${images && images[0] && images[0].url}`} />
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
            <div>
            <h1>{category.name}</h1>
            <div>
            {!!category.goods?.length ? category.goods.map(good => <GoodCard key={good._id} good={good}/>) : <>No goods in this category</>}
            </div>
          </div>
        </div> : <>Loading</>
    )
}

const CPageCategory = connect(state => ({category: state.categoryById?.payload?.data?.CategoryFindOne}), {onIdChange: actionCategoryById})(PageCategory)

const PageGood = ({match: {params: {_id}}}) =>
<div>
    <h1>Тут будет товар с _id: {_id}</h1>
</div>

const Content = () =>
<div className='Content'>
    <Route path="/category/:_id" component={CPageCategory} />
    {/* <Route path="/good/:_id" component={PageGood} /> */}
</div>

const App = () =>
<Router history={history}>
    <Provider store={store}>
        <CLeftMenu />
        <Content />
    </Provider>
</Router>


export default App;
