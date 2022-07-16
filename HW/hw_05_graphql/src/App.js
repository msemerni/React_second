// Разработать запросы (используя функцию gql и "песочницу" GraphQL):
// - отображение одной категории по _id и товаров из неё(только название, картинки и цена);
// - отображения одного товара (с описанием и остальными нужными полями)
// полученные промисы запросов из функции gql положить в разные промисы promiseReducers 
// (придумать разные имена промисов и сделать store.dispatch(actionPromise(какой-то промис из gql))
// придумать компоненты отображения категории со списком товаров и товара со всеми подробностями, 
// описанием, ценой и несколькими товарами
// В качестве категорий используйте категории "Samsung" и "iPhone", в качестве товаров - пару смартфонов. 
// Эти товары и категории обладают картинками и вообще похоже на настоящие, в отличие от тестовых категорий  и товаров

import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { Provider, connect } from 'react-redux';

const Header = () => {
  return (
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <a href='http://shop-roles.node.ed.asmer.org.ua/graphql' target='blank'>GraphQL</a>
    </header>
  )
}

const Loader = () => {
  return(
    <div className="LoaderContainer">
      <img src={logo} className="Loader" alt="logo" />
    </div>
  )
}

const gql = (url, query, variables) =>
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ query, variables })
  })
    .then(res => res.json())
// .then(json => console.log(json))

const BACKEND_URL = "http://shop-roles.node.ed.asmer.org.ua/";
const BACKEND_URL_QUERY = "http://shop-roles.node.ed.asmer.org.ua/graphql";

const queryCatById = (_id, name) => {
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

  return actionPromise(name, queryPromise)
}

const queryGoodById = (_id, name) => {
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

  return actionPromise(name, queryPromise)
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

const catSamsung = queryCatById("62c94990b74e1f5f2ec1a0dc", "CategorySamsung");
const catIPhone = queryCatById("62c9472cb74e1f5f2ec1a0d4", "CategoryIPhone");
const iPhoneX = queryGoodById("62c9472cb74e1f5f2ec1a0d2", "GoodIPhoneX");
const galaxyM52 = queryGoodById("62c94990b74e1f5f2ec1a0db", "GoodGalaxyM52");

store.dispatch((catSamsung));
store.dispatch((catIPhone));
store.dispatch((iPhoneX));
store.dispatch((galaxyM52));

const ShowCategory = ({ status, categoryData, error }) => {
  // let category;
  // if(status === 'FULFILLED') {
  //   category = payload.data.CategoryFindOne;
  //   console.log("PAYLOAD: ", category);
  // }
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

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <Header />
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
