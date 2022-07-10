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
import React, { useState } from 'react';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { Provider, connect } from 'react-redux';

const Header = () => {
  return (
    <header className="App-header">
      <a href='https://swapi.dev/api/' target='blank'>swapi.dev</a>
    </header>
  )
}

// function promiseReducer(state = {}, action) {
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
store.subscribe(() => console.log(store.getState()))

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

const urlObiWan = "https://swapi.dev/api/people/10";
const urlEpisode4 = "https://swapi.dev/api/films/1/";

store.dispatch(actionPromise('ObiWan', fetchData(urlObiWan)));
store.dispatch(actionPromise('Episode4', fetchData(urlEpisode4)));

async function fetchData(url) {
  const data = await fetch(url);
  const dataJSON = await data.json();
  const resultJSON = {};
  for (const objectItem of Object.entries(dataJSON)) {
    if (!Array.isArray(objectItem[1])) {
      resultJSON[objectItem[0]] = objectItem[1];
    } else {
      const requests = objectItem[1].map(async url => {
        const res = await fetch(url);
        return res;
      })
      // await Promise.all(requests)
      //   .then(responses => Promise.all(responses.map(result => result.json())))
      //   .then(json => resultJSON[objectItem[0]] = json);
      const responses = await Promise.all(requests);
      const json = await Promise.all(responses.map(result => result.json()));
      resultJSON[objectItem[0]] = json;
    }
  }

  return resultJSON;
}

const Episode = ({ status, payload, error }) => {
  return (
    <div className='episode'>
      {status === 'FULFILLED' ?
        <>
          <h3>{payload.name}</h3>
          <p>Birth year: <strong>{payload.birth_year}</strong></p>
          <p>Gender: <strong>{payload.gender}</strong></p>
          <details className='details'>
            <summary>Films:</summary>
            <ol className='films'>
              {payload.films.map(film => <li><strong>{film.title}</strong></li>)}
            </ol>
          </details>
          <details className='details'>
            <summary>Starships:</summary>
            <ol className='films'>
              {payload.starships.map(starship => <li><strong>Name: </strong>{starship.name} <br /> <strong>Model: </strong>{starship.model}</li>)}
            </ol>
          </details>
        </> : "LOADING..."
      }
      {status === 'REJECTED' && <><strong>ERROR</strong>: {error}<br /></>}
    </div>
  )
}

const Film = ({ status, payload, error }) => {
  return (
    <div className='film'>
      {status === 'FULFILLED' ?
        <>
          <h3>{payload.title}</h3>
          <p>Release date: <strong>{payload.release_date}</strong></p>
          <p>Director: <strong>{payload.director}</strong></p>
          <details className='details'>
            <summary>Characters:</summary>
            <ol className='characters'>
              {payload.characters.map(character => <li><strong>{character.name}</strong></li>)}
            </ol>
          </details>
          <details className='details'>
            <summary>Species:</summary>
            <ol className='characters'>
              {payload.species.map(specie => <li><strong>{specie.name}</strong></li>)}
            </ol>
          </details>
        </> : "LOADING..."
      }
      {status === 'REJECTED' && <><strong>ERROR</strong>: {error}<br /></>}
    </div>
  )
}

const CObiWan = connect(state => state.ObiWan || {})(Episode);
const CEpisode4 = connect(state => state.Episode4 || {})(Film);

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <Header />
        <div className='content'>
          <CObiWan />
          <CEpisode4 />
        </div>
      </div>
    </Provider>
  );
}

export default App;






//// не работает:
// function fetchData (url) {
//   fetch(url)
//   .then(obiWan => obiWan.json())
//   .then(json => {
//     const resultJSON = {};
//     for (const objectItem of Object.entries(json)) {
//       if (!Array.isArray(objectItem[1])) {
//         resultJSON[objectItem[0]] = objectItem[1];
//       } else {
//         const requests = objectItem[1].map(url => {
//           const res = fetch(url)
//           return res;
//         })
//         Promise.all(requests)
//           .then(responses => Promise.all(responses.map(result => result.json())))
//           .then(json => resultJSON[objectItem[0]] = json);
//       }
//     }
//     // console.log(resultJSON);
//     return resultJSON;
//   })
// }
