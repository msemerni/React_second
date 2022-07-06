import logo from './logo.svg';
import './App.css';
import {useState} from 'react';

const Input = () => {
    const [text, setText] = useState("текст из useState")
    console.log(text)
    return (
        <>
            <input type="text" 
                        value={text} 
                        onChange={(e) => setText(e.target.value)}/>
            <span>{text.length > 8 ? "OK" : "Unsafe password"}</span>
        </>)
}

const Color = ({onColor}) => {
    const [red, setRed]     = useState(0)
    const [green, setGreen] = useState(0)
    const [blue, setBlue]   = useState(0)
    return (
        <div style={   {backgroundColor: `rgb(${red}, ${green}, ${blue})`}  }>
            <input type='number' min={0}
                                 max="255" 
                                 onChange={(e) => setRed(e.target.value)}
                                 value={red}/>
            <input type='number' min="0" 
                                 max={255} 
                                 onChange={(e) => setGreen(e.target.value)}
                                 value={green}/>
            <input type='number' min="0" 
                                 max="255" 
                                 onChange={(e) => setBlue(e.target.value)}
                                 value={blue}/>
            <button onClick={() => onColor({red, green, blue})}>Ok</button>
        </div>
    )
}


function App() {
  return (
    <div className="App">
      <Color onColor={({red, green, blue}) => alert(`${red}, ${green}, ${blue}`)}/>
      <Input />
    </div>
  );
}

export default App;
