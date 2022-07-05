import logo from './logo.svg';
import './App.css';
import { useState } from 'react';

const Sum = ({ a, b }) =>
  <code>a + b = {a} + {b} = {a + +b}</code>

const Sum2 = (props) => {
  const {a, b} = props;
  return <code>a + b = {a} + {b} = {+a + +b}</code>
}

const Button = props => {
  const { type, ...other } = props;
  const className = type === "primary" ? "PrimaryButton" : "SecondaryButton";
  return <button className={className} {...other} />;
};

const Input1 = () => 
  <p>2+2={2+2}</p>

const Input2 = () => 
  <p>Paragraph</p>

const Input3 = () => {
  const [text, setText] = useState();
  console.log(text);
  return (
    <div>
      <input type="text"
             placeholder='Enter password'
             value={text}
             onChange={(e) => {
               setText(e.target.value); 
               console.dir(text);}}/>
      <span>{text}</span>
    </div>
  )
}

const Color = ({onColor}) => {
  const [red, changeRed] = useState(0)
  const [green, changeGreen] = useState(0)
  const [blue, changeBlue] = useState(0)
  return (
    <div>
      <input type="number"
             min={0}
             max={255}
             value={red}
             onChange={(e) => {changeRed(e.target.value)}}/>
      <input type="number"
             min={0}
             max={255}
             value={green}
             onChange={(e) => {changeGreen(e.target.value)}}/>
      <input type="number"
             min={0}
             max={255}
             value={blue}
             onChange={(e) => {changeBlue(e.target.value)}}/>
      <input type="button" value="Ok"
             onClick={() => onColor({red, green, blue})}/>
      <div style={ {backgroundColor: `rgb(${red}, ${green}, ${blue})`, height: "30px"} }></div>
      <hr/>
      <div style={ {backgroundColor: `rgb(${green}, ${blue}, ${red})`, height: "30px"} }></div>
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Sum a={8} b="7"/>
        <Sum2 a="10" b="12"/>
        <Button type="primary" onClick={() => console.log("Нажато!")}>
          Hello World!
        </Button>
        <Input1/>
        <Input2/>
        <Input3/>
        <Color onColor={({red, green, blue}) => alert (`${red}, ${green}, ${blue}`)}/>
      </header>
    </div>
  );
}

export default App;
