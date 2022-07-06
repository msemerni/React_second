import logo from './logo.svg';
import './App.css';
import {useState} from "react";

const Sum = ({ a, b }) =>
  <code>a + b = {a} + {b} = {+a + +b}</code>

const Input = () =>  {
  // const 
<input type="text" value="текст"/>
}

//
function App() {
  return (
    <>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          <Sum a="3" b="6"/>
        </header>

      </div>
      <Sum a="2" b="5"/>
      {/* <div class="wrapper">
        <div class="box header">Header</div>
        <div class="box sidebar">Sidebar</div>
        <div class="box sidebar2">Sidebar 2</div>
        <div class="box content">Content
          <br /> More content than we had before so this column is now quite tall.</div>
        <div class="box footer">Footer</div>
      </div> */}
    </>
  );
}

export default App;
