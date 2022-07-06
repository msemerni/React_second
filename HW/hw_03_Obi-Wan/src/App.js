import logo from './logo.svg';
import './App.css';
import React, {useState} from 'react';

const Header = () => {
  return (
    <header className="App-header">
      <a href='https://swapi.dev/api/' target='blank'>swapi.dev</a>
    </header>
  )
}



function App() {
  return (
    <div className="App">
      <Header/>
      <div className='content'>
        
      </div>
    </div>
  );
}

export default App;
