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
      <a href='http://shop-roles.node.ed.asmer.org.ua/graphql' target='blank'>GraphQL</a>
    </header>
  )
}
/////////////////////
const BACKEND_URL = "http://shop-roles.node.ed.asmer.org.ua/";
const BACKEND_URL_QUERY = "http://shop-roles.node.ed.asmer.org.ua/graphql";

let gql = (url, query, variables) =>
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

////////////////////////////////////////////////////////
// function queryCatById(ID) {
//   return (
//     `query CategorySamsung($CategoryID: String) {
//       CategoryFindOne(query: $CategoryID) {
//         _id name
//         goods {
//           _id
//           name
//           price
//           images {
//             url
//           }
//         }
//       }
//     }`,
//     { CategoryID: `[{\"_id\":\"${ID}}\"}]` }
//   )
// }

// let catSamsung = gql(BACKEND_URL_QUERY, queryCatById("62c94990b74e1f5f2ec1a0dc"), "62c94990b74e1f5f2ec1a0dc")
////////////////////////////////////////////////////////

let catSamsung = gql("http://shop-roles.node.ed.asmer.org.ua/graphql",
  `query CategorySamsung($CategorySamsung: String) {
                          CategoryFindOne(query: $CategorySamsung) {
                            _id name
                            goods {
                              _id
                              name
                              price
                              images {
                                url
                              }
                            }
                          }
                        }`,
  { CategorySamsung: "[{\"_id\":\"62c94990b74e1f5f2ec1a0dc\"}]" }
);

let catIPhone = gql("http://shop-roles.node.ed.asmer.org.ua/graphql",
  `query CategoryIPhone($CategoryIPhone: String) {
                          CategoryFindOne(query: $CategoryIPhone) {
                            _id name
                            goods {
                              _id
                              name
                              price
                              images {
                                url
                              }
                            }
                          }
                        }`,
  { CategoryIPhone: "[{\"_id\":\"62c9472cb74e1f5f2ec1a0d4\"}]" }
);

let goodIPhoneX = gql("http://shop-roles.node.ed.asmer.org.ua/graphql",
                      `query Good ($someGood: String) {
                        GoodFindOne (query: $someGood) {
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
                      { someGood: "[{\"_id\":\"62c9472cb74e1f5f2ec1a0d2\"}]" }
);

let goodGalaxyM52 = gql("http://shop-roles.node.ed.asmer.org.ua/graphql",
                        `query Good ($someGood: String) {
                          GoodFindOne (query: $someGood) {
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
                        { someGood: "[{\"_id\":\"62c94990b74e1f5f2ec1a0db\"}]" }
);

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

store.dispatch(actionPromise('catSamsung', catSamsung));
store.dispatch(actionPromise('catIPhone', catIPhone));
store.dispatch(actionPromise('galaxyM52', goodGalaxyM52));
store.dispatch(actionPromise('iPhoneX', goodIPhoneX));

////////////////////////

const ShowCategory = ({status, payload, error}) => {
  return (
    <div className='categoriesContainer'>
      {status === 'FULFILLED' ?
        <div className='categories'>
          <h3>{payload.data.CategoryFindOne.name}</h3>
          <GoodsList goodsArray = {payload.data.CategoryFindOne.goods}/>
        </div> : "LOADING..."
      }
      {status === 'REJECTED' && <><strong>ERROR</strong>: {error}<br /></>}
    </div>
  )
}

const GoodsList = ({goodsArray}) => {
  return (
    <ol className='goods'>
       {goodsArray.map(good => <li key={good._id}><strong>{good.name}</strong></li>)}
    </ol>
  )
}

const ShowGood = ({status, payload, error}) => {
  return (
    <div className='goodContainer'>
      {status === 'FULFILLED' ?
        <div className="good">
          <div>
            <h3>{payload.data.GoodFindOne.name}</h3>
            <p className = "price">Price: $<strong>{payload.data.GoodFindOne.price}</strong></p>

            <img className="imgGood" src={"http://shop-roles.node.ed.asmer.org.ua/"+payload.data.GoodFindOne.images[0].url} 

                alt={payload.data.GoodFindOne.name}></img>
            <details className='details'>
              <summary><u><i>Description:</i></u></summary>
              <p>{payload.data.GoodFindOne.description}</p>
            </details>
          </div>
          <div className='card_button_container'>
            <button className='card_button'>Buy</button>
          </div>
        </div> : "LOADING..."
      }
      {status === 'REJECTED' && <><strong>ERROR</strong>: {error}<br /></>}
    </div>
  )
}

const CSamsungCategory = connect(state => state.catSamsung || {})(ShowCategory);
const CIPhoneCategory = connect(state => state.catIPhone || {})(ShowCategory);
const CGalaxyM52 = connect(state => state.galaxyM52 || {})(ShowGood);
const CIPhoneX = connect(state => state.iPhoneX || {})(ShowGood);

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <Header />
        <div className='content'>
          <CSamsungCategory />
          <CIPhoneCategory />
          <CGalaxyM52/>
          <CIPhoneX/>
        </div>
      </div>
    </Provider>
  );
}

export default App;


/////////////////////
const FULL_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOnsiaWQiOiI2MmNjODUzNmI3NGUxZjVmMmVjMWEwZTQiLCJsb2dpbiI6Im1zZW1lcm5pIiwiYWNsIjpbIjYyY2M4NTM2Yjc0ZTFmNWYyZWMxYTBlNCIsInVzZXIiXX0sImlhdCI6MTY1NzU3MTExNn0.wzdnPlsQlsH8gNqVVcR7dW2Fj2NPjWVoKwV3zLXwaGs";
const USEFULL_TOKEN = "eyJzdWIiOnsiaWQiOiI2MmNjODUzNmI3NGUxZjVmMmVjMWEwZTQiLCJsb2dpbiI6Im1zZW1lcm5pIiwiYWNsIjpbIjYyY2M4NTM2Yjc0ZTFmNWYyZWMxYTBlNCIsInVzZXIiXX0sImlhdCI6MTY1NzU3MTExNn0";
const userInfo = JSON.parse(atob(USEFULL_TOKEN));
// console.log(userInfo);
////////////////////


////////////////////////////////
// query Cats {
//   CategoryFind(query: "[{}]") {
//     _id
//     name
//     goods {
//       _id
//       name
//       price
//       images {
//         _id
//         url
//       }
//     }
//   }
// }

// query catByID($someID: String) {
//   CategoryFindOne(query: $someID) {
//     _id name
//     goods {
//       _id name images {
//         url
//       }
//     }
//   }
// }

// mutation Register($login: String, $password: String) {
//   UserUpsert(user: {login: $login, password: $password}) {
//     _id login
//   }
// }

// query log($login: String, $password: String) {
//   login (login: $login, password: $password)
// }

// query UserInfo {
//   UserFind (query: "[{}]") {
//     _id login createdAt
//   }
// }

// query CategorySamsung($CategorySamsung: String) {
//   CategoryFindOne(query: $CategorySamsung) {
//     _id name
//     goods {
//       _id
//       name
//       price
//       images {
//         url
//       }
//     }
//   }
// }

// query CategoryIPhone($CategoryIPhone: String) {
//   CategoryFindOne(query: $CategoryIPhone) {
//     _id name
//     goods {
//       _id
//       name
//       price
//       images {
//         url
//       }
//     }
//   }
// }

// query Good ($someGood: String) {
//   GoodFindOne (query: $someGood) {
//     _id
//     name
//     description
//     price
//     orderGoods {
//     	_id price count total
//     	}
//     images {
//       _id url
//     }
//     categories {
//       _id name
//     	}
//     owner {
//       _id nick
//     	}
//   }
// }

// {
//   "someID": "[{\"_id\":\"6262ca19bf8b206433f5b3d0\"}]",
//   "login": "msemerni",
//   "password": "123",
//   "CategorySamsung": "[{\"_id\":\"62c94990b74e1f5f2ec1a0dc\"}]",
//   "CategoryIPhone": "[{\"_id\":\"62c9472cb74e1f5f2ec1a0d4\"}]",
//   "someGood": "[{\"_id\":\"62c9472cb74e1f5f2ec1a0d2\"}]"
// }
