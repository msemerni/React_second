import logo from './logo.svg';
import './App.css';
import { useState } from 'react';

const LoginForm = ({onLogin}) => {
  const [login, setLogin] = useState();
  const [password, setPassword] = useState();
  return (
    <form id='loginForm' className ='header_form'>
      <label>Login: 
        <input id="login" 
               type="text" 
               placeholder='login'
               onChange={(e) => {setLogin(e.target.value)}}
               // не работает что ниже в комментах:
              //  {login.length >= 3 && style={{backgroundColor: 'lightgreen'}}} />
              //  style={login.length >= 3 ? {backgroundColor: 'lightred'} : {backgroundColor: 'lightgreen'} }
               />
      </label>
      <label>Password: 
        <input type="password"
               placeholder='password'
               onChange={(e) => {setPassword(e.target.value)}}/>
        </label>
      <div>
        <button type="submit" 
                disabled={((!login || !password) || login.length < 3) && "Ok"}
                onClick={(e) => {
                  onLogin({login, password})
                  e.preventDefault()}}
                  >Ok</button>
        <button type="reset" 
                disabled={(!login || !password)}
                onReset={() => {
                  {setLogin(null)} // задисейблить кнопки если Отмена ?
                  // login = null
                  // password = null
                  // setLogin(null)
                  // setPassword(null)
                  // onLogin({login, password})
                }}
                >Cancel</button>
      </div>
    </form>
  )
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <LoginForm onLogin={({login, password}) => alert(`${login}, ${password}`)}/>
      </header>
    </div>
  );
}

export default App;
