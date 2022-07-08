//ДЗ:
// 1) сформировать промисы для скачивания полной информации о Obi-Wan: 
// https://swapi.dev/api/people/10, вместе с массивами объектов films, vehicles, starships, 
// а так же про первую (четвертую) часть киносаги (https://swapi.dev/api/films/1/),  вместе с 
// массивами characters, planets, starships, vehicles, species. 
// Вместо ссылок должны появится сами объекты, которые скачиваются по этим ссылкам 
// (например https://swapi.dev/api/people/1/)
// 2) отдать эти промисы (об Obi-Wan и Episode 4) в actionPromise и redux. Используйте разные имена промисов.
// 3) создать компоненты отображения этой информации
// 4) сделать connect для получения информации из  хранилища redux в компонентах

// import logo from './logo.svg';
import './App.css';
// import React, {useState} from 'react';
import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import {Provider, connect} from 'react-redux';

const Header = () => {
  return (
    <header className="App-header">
      <a href='https://swapi.dev/api/' target='blank'>swapi.dev</a>
    </header>
  )
}

// function promiseReducer(state = {}, action) {
function promiseReducer(state, {type, status, name, payload, error}) {
  if (state === undefined) {
    return {};
  }

  if (type === "PROMISE") {
    return {
      ...state,
      [name]: {status, payload, error}
    }
  }

  return state;
}

const store = createStore(promiseReducer, applyMiddleware(thunk));
store.subscribe(() => console.log(store.getState()))

const actionPending = (name) => ({type: "PROMISE", status: "PENDING", name});
const actionFulfilled = (name, payload) => ({type: "PROMISE", status: "FULFILLED", name, payload});
const actionRejected = (name, error) => ({type: "PROMISE", status: "REJECTED", name, error});

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

const urlObiWan = "https://swapi.dev/api/people/10";
const urlEpisode4 = "https://swapi.dev/api/films/1/";
store.dispatch(actionPromise('Obi-Wan', fetch(urlObiWan)
              .then(obiWan => obiWan.json())
              // .then(res => console.log(res))
              .then(obiWan1 => obiWan1.films.map((film) => fetch(film)))
              .then(res => Promise.all(res))
              
              
))

// store.dispatch(actionPromise('Episode_4', fetch(urlEpisode4).then(res => res.json())))

///////////////////////////////////////////////////////////////////////////////////////////////
// const urlObiWan = "https://swapi.dev/api/people/10";
// const fourthPart = "https://swapi.dev/api/films/1/";

// const Fetch = (url_) => {
  
//   fetch(url_);

//   async function fetch  (url) {
//     if (!url) {
//       console.log('Url is missed');
//       return;
//     }
//     try {
//       const response = await fetch(url);
//       if (!response.ok) {
//         throw new Error(`Error: ${response.statusText}`);
//       }
//       const data = await response.json();
//       console.log(data);
//       return data;
//     } catch (error) {
//       console.log(error);
//     }

//     return (
//       <div>fff</div>
//     )
//   };
//   return (
//     <div>fff</div>
//   )
// }

 
function App() {
  return (
    <div className="App">
      <Header />
      <div className='content'>
        {/* <Fetch url={urlObiWan}/> */}
      </div>
    </div>
  );
}

export default App;
