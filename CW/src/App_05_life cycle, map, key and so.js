import logo from './logo.svg';
import './App.scss';
import React, {useState, useEffect} from 'react';
import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import {Provider, connect} from 'react-redux';

function promiseReducer(state, {type, status, name, payload, error}){ //payload
    //про промис будет какой-то его результат;
    //status - FULFILLED, REJECTED, PENDING
    //error (на случай REJECTED)
    //{name1: {status, payload, error},
    // name2: {status, payload, error}}

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

const delay = ms => new Promise(resolve => setTimeout(() => resolve(ms), ms))
const store = createStore(promiseReducer, applyMiddleware(thunk))
//store.subscribe(() => console.log(store.getState()))

const actionPending   = name            => ({type: 'PROMISE', status: 'PENDING', name})
const actionFulfilled = (name, payload) => ({type: 'PROMISE', status: 'FULFILLED', name, payload})
const actionRejected  = (name, error)   => ({type: 'PROMISE', status: 'REJECTED', name, error})

const actionPromise = (name, promise) =>
    //тут будет сценарий, который любой промис проводит по шагам pending -> fulfilled или pending -> rejected
    //и про каждый такой шаг докладывает в store
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

store.dispatch(actionPromise('delay3000', delay(3000)))
store.dispatch(actionPromise('delay5000', delay(5000)))

const url = 'https://shop-items-server.herokuapp.com/'
store.dispatch(actionPromise('shopItems', fetch(url).then(res => res.json())))

const PromiseViewer = ({status, payload, error}) =>
<div>
    <strong>Status</strong>: {status}<br/>
    {status === 'FULFILLED' &&  <><strong>Payload</strong>: {payload}<br/></>}
    {status === 'REJECTED'  &&  <><strong>ERROR</strong>: {error}<br/></>}
</div>

const Delay3000Viewer = connect(state => state.delay3000 || {})(PromiseViewer)
const Delay5000Viewer = connect(state => state.delay5000 || {})(PromiseViewer)

//store.dispatch(actionPending('delay3000'))
//delay(3000).then(result => store.dispatch(actionFulfilled('delay3000', result)), 
                 //err => store.dispatch(actionRejected('delay3000', err)))

//store.dispatch(actionPending('delay5000'))
//delay(5000).then(result => store.dispatch(actionFulfilled('delay5000', result)), 
                 //err => store.dispatch(actionRejected('delay5000', err)))







const Input = () => {
    const [text, setText] = useState("текст из useState")
    console.log(text)
    return (
        <>
            <input type="text" 
                        value={text} 
                        onChange={(e) => setText(e.target.value)}/>
            <span>{!!text.length && <Color />}</span>
        </>)
}

const _ = React.createElement.bind(React)

const Input2 = () => {
    const [text, setText] = useState("no jsx")
    console.log(text)
    return (
        _(React.Fragment, null, 
            _('input',{type:"text",
                        value:text, 
                        onChange:(e) => setText(e.target.value)}),
            _('span',null, text.length > 8 ? "OK" : "Unsafe password")
        ))
}

//const inputMarkup = <input type="text" value={"придумал текст"} />
//console.log(<div className="myDiv">{inputMarkup}</div>)
//console.log(React.createElement('div', { className:"myDiv" } , inputMarkup))
////
//console.log(<Input />)

const Color = ({onColor}) => {
    const [red, setRed]     = useState(0)
    const [green, setGreen] = useState(0)
    const [blue, setBlue]   = useState(0)
    return (
        <div style={   {backgroundColor: `rgb(${red}, ${green}, ${blue})`}  }>
            <input type='number' min="0" 
                                 max="255" 
                                 onChange={(e) => setRed(e.target.value)}
                                 value={red}/>
            <input type='number' min="0" 
                                 max="255" 
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

const cars = [
    {brand: 'bmw', color: 'red', seats: 2},
    {brand: 'zaz', color: 'green', seats: 5},
    {brand: 'toyota', color: 'black', seats: 5},
]

const Car = ({car: {brand, color, seats}}) => 
<li style={{color}}>
    <strong>{brand}</strong>,
    {seats} жопомест
</li>

const data = [{"id":1,"category":"mac","imgUrl":"items/macbook-air.png","name":"MacBook Air","display":13.3,"color":["Gold","Silver","Space Grey"],"price":999,"chip":{"name":"M1","cores":8},"ram":8,"storage":256,"touchId":true,"faceId":false,"wireless":["Wi-Fi","Bluetooth 5.0"],"camera":{"front":"720p FaceTime HD camera","back":null},"audio":{"microphone":"Three-mic array with directional beamforming","speakers":"Stereo speakers"},"size":{"height":"1.61","width":"30.41","depth":"21.24","weight":"1.29"},"os":"macOS","InTheBox":["MacBook Air","30W USB-C Power Adapter","USB-C Charge Cable (2 m)"],"orderInfo":{"inStock":435,"reviews":77}},{"id":2,"category":"mac","imgUrl":"items/macbook-air.png","name":"MacBook Air","display":13.3,"color":["Gold","Silver","Space Grey"],"price":1249,"chip":{"name":"M1","cores":8},"ram":16,"storage":512,"touchId":true,"faceId":false,"wireless":["Wi-Fi","Bluetooth 5.0"],"camera":{"front":"720p FaceTime HD camera","back":null},"audio":{"microphone":"Three-mic array with directional beamforming","speakers":"Stereo speakers"},"size":{"height":"1.61","width":"30.41","depth":"21.24","weight":"1.29"},"os":"macOS","InTheBox":["MacBook Air","30W USB-C Power Adapter","USB-C Charge Cable (2 m)"],"orderInfo":{"inStock":0,"reviews":84}},{"id":3,"category":"mac","imgUrl":"items/macbook-pro13.png","name":"MacBook Pro 13","display":13.3,"color":["Silver","Space Grey"],"price":1299,"chip":{"name":"Intel Core i5","cores":8},"ram":8,"storage":512,"touchId":true,"faceId":false,"wireless":["Wi-Fi","Bluetooth 5.0"],"camera":{"front":"720p FaceTime HD camera","back":null},"audio":{"microphone":"Studio-quality three-mic array with high signal-to-noise ratio and directional‑beamforming","speakers":"Stereo speakers"},"size":{"height":"1.56","width":"30.41","depth":"21.24","weight":"1.4"},"os":"macOS","InTheBox":["MacBook pro 13","61W USB-C Power Adapter","USB-C Charge Cable (2 m)"],"orderInfo":{"inStock":25,"reviews":85}},{"id":4,"category":"mac","imgUrl":"items/macbook-pro13.png","name":"MacBook Pro 13","display":13.3,"color":["Silver","Space Grey"],"price":1499,"chip":{"name":"M1","cores":8},"ram":16,"storage":1024,"touchId":true,"faceId":false,"wireless":["Wi-Fi","Bluetooth 5.0"],"camera":{"front":"720p FaceTime HD camera","back":null},"audio":{"microphone":"Studio-quality three-mic array with high signal-to-noise ratio and directional‑beamforming","speakers":"Stereo speakers"},"size":{"height":"1.56","width":"30.41","depth":"21.24","weight":"1.4"},"os":"macOS","InTheBox":["MacBook pro 13","61W USB-C Power Adapter","USB-C Charge Cable (2 m)"],"orderInfo":{"inStock":256,"reviews":80}},{"id":5,"category":"mac","imgUrl":"items/macbook-pro16.png","name":"MacBook Pro 16","display":16,"color":["Silver","Space Grey"],"price":2399,"chip":{"name":" Intel Core i7","cores":6},"ram":16,"storage":1024,"touchId":true,"faceId":false,"wireless":["Wi-Fi","Bluetooth 5.0"],"camera":{"front":"720p FaceTime HD camera","back":null},"audio":{"microphone":"Studio‑quality three-mic array with high signal-to-noise ratio and directional beamforming","speakers":"Stereo speakers"},"size":{"height":"1.62","width":"35.79","depth":"24.59","weight":"2"},"os":"macOS","InTheBox":["MacBook pro 16","96W USB-C Power Adapter","USB-C Charge Cable (2 m)"],"orderInfo":{"inStock":124,"reviews":91}},{"id":6,"category":"mac","imgUrl":"items/macbook-pro16.png","name":"MacBook Pro 16","display":16,"color":["Silver","Space Grey"],"price":2799,"chip":{"name":" Intel Core i9","cores":8},"ram":32,"storage":2048,"touchId":true,"faceId":false,"wireless":["Wi-Fi","Bluetooth 5.0"],"camera":{"front":"720p FaceTime HD camera","back":null},"audio":{"microphone":"Studio‑quality three-mic array with high signal-to-noise ratio and directional beamforming","speakers":"Stereo speakers"},"size":{"height":"1.62","width":"35.79","depth":"24.59","weight":"2"},"os":"macOS","InTheBox":["MacBook pro 16","96W USB-C Power Adapter","USB-C Charge Cable (2 m)"],"orderInfo":{"inStock":69,"reviews":90}},{"id":7,"category":"mac","imgUrl":"items/imac.png","name":"IMac","display":21.5,"color":["Space Grey"],"price":1099,"chip":{"name":"Intel Core i5,","cores":"6"},"ram":8,"storage":256,"touchId":false,"faceId":false,"wireless":["Wi-Fi","Bluetooth 4.2 "],"camera":{"front":"720p FaceTime HD camera","back":null},"audio":{"microphone":"Microphone","speakers":"Stereo speakers"},"size":{"height":"45","width":"52.8","depth":"17.5","weight":"5.44"},"os":"macOS","InTheBox":["iMac ","Magic Keyboard","Magic Mouse 2","Power cord","Lightning to USB Cable","Polishing cloth"],"orderInfo":{"inStock":742,"reviews":75}},{"id":8,"category":"mac","imgUrl":"items/imac.png","name":"IMac","display":27,"color":["Space Grey"],"price":1799,"chip":{"name":"Intel Core i5,","cores":"6"},"ram":8,"storage":256,"touchId":false,"faceId":false,"wireless":["Wi-Fi","Bluetooth 5.0 "],"camera":{"front":"720p FaceTime HD camera","back":null},"audio":{"microphone":"Microphone","speakers":"Stereo speakers"},"size":{"height":"51.6","width":"65","depth":"20.3","weight":"8.92"},"os":"macOS","InTheBox":["iMac with Retina 5K display ","Magic Keyboard","Magic Mouse 2","Power cord","Lightning to USB Cable","Polishing cloth"],"orderInfo":{"inStock":0,"reviews":99}},{"id":9,"category":"mac","imgUrl":"items/mac_pro.png","name":"Mac Pro","display":null,"color":["Space Grey"],"price":2499,"chip":{"name":"Intel Xeon W","cores":"16"},"ram":64,"storage":1024,"touchId":false,"faceId":false,"wireless":["Wi-Fi","Bluetooth 5.0 "],"camera":{"front":null,"back":null},"audio":{"microphone":"Microphone","speakers":"Stereo speakers"},"size":{"height":"50","width":"30","depth":"60","weight":"18"},"os":"macOS","InTheBox":["Mac Pro","Magic Keyboard with Numeric Keypad","Magic Mouse 2","USB-C to Lightning Cable (1 m)","Power cord (2 m)"],"orderInfo":{"inStock":587,"reviews":56}},{"id":10,"category":"ipad","imgUrl":"items/ipad-pro.jpeg","name":"IPad Pro ","display":11,"color":["Silver","Space Grey"],"price":750,"chip":{"name":"A12Z Bionic","cores":null},"ram":null,"storage":128,"touchId":false,"faceId":true,"wireless":["Wi-Fi","Bluetooth 5.0"],"camera":{"front":"720p FaceTime HD camera","back":"Ultra Wide: 10MP"},"audio":{"microphone":"Studio‑quality three-mic array with high signal-to-noise ratio and directional beamforming","speakers":"Stereo speakers"},"size":{"height":"24.7","width":"17.8","depth":"0.6","weight":"0.470"},"os":"macOS","InTheBox":["iPad Pro","USB-C Charge Cable (1 meter)","18W USB-C Power Adapter"],"orderInfo":{"inStock":32,"reviews":99}},{"id":34,"category":"ipad","imgUrl":"items/ipad-air.png","name":"IPad Air","display":10.9,"color":["Silver","Space Grey","Rose Gold","Green","Sky Blue"],"price":549,"chip":{"name":"A14 Bionic ","cores":null},"ram":null,"storage":64,"touchId":true,"faceId":false,"wireless":["Wi-Fi","Bluetooth 5.0"],"camera":{"front":"720p FaceTime HD camera","back":"Ultra Wide: 10MP"},"audio":{"microphone":"Dual microphones for calls, video recording, and audio recording","speakers":"Stereo speakers"},"size":{"height":"24.7","width":"17.8","depth":"0.6","weight":"0.458"},"os":"macOS","InTheBox":["iPad Air","USB-C Charge Cable (1 meter)","20W USB-C Power Adapter"],"orderInfo":{"inStock":97,"reviews":97}},{"id":11,"category":"ipad","imgUrl":"items/ipad.png","name":"IPad","display":10.2,"color":["Silver","Space Grey","Gold"],"price":309,"chip":{"name":"A12 Bionic  ","cores":null},"ram":null,"storage":32,"touchId":true,"faceId":false,"wireless":["Wi-Fi","Bluetooth 5.0"],"camera":{"front":"720p FaceTime HD camera","back":"Ultra Wide: 10MP"},"audio":{"microphone":"Dual microphones for calls, video recording, and audio recording","speakers":"Stereo speakers"},"size":{"height":"25.7","width":"17.4","depth":"0.6","weight":"0.490"},"os":"macOS","InTheBox":["iPad","USB-C Power Adapter","Lightning to USB-C Cable"],"orderInfo":{"inStock":90,"reviews":0}},{"id":12,"category":"ipad","imgUrl":"items/ipad-mini.png","name":"IPad mini","display":7.9,"color":["Silver","Space Grey","Gold"],"price":309,"chip":{"name":"A12 Bionic  ","cores":null},"ram":null,"storage":64,"touchId":true,"faceId":false,"wireless":["Wi-Fi","Bluetooth 5.0"],"camera":{"front":"720p FaceTime HD camera","back":"Ultra Wide: 10MP"},"audio":{"microphone":"Dual microphones for calls, video recording, and audio recording","speakers":"Stereo speakers"},"size":{"height":"20.3","width":"13.4","depth":"0.6","weight":"0.300"},"os":"macOS","InTheBox":["iPad mini","USB-C Power Adapter","Lightning to USB-C Cable"],"orderInfo":{"inStock":77,"reviews":85}},{"id":13,"category":"Watch","imgUrl":"items/apple-watch-series-6.png","name":"Apple Watch Series 6","display":1.73228,"color":["Silver","Space Grey","Gold","Blue","Graphite"],"price":399,"chip":{"name":"S6 SiP   ","cores":null},"ram":null,"storage":32,"touchId":false,"faceId":false,"wireless":["Wi-Fi","Bluetooth 5.0"],"camera":{"front":null,"back":null},"audio":{"microphone":"Dual microphones for calls, video recording, and audio recording","speakers":"Stereo speakers"},"size":{"height":"4,4","width":"3.8","depth":"0.6","weight":"1.07"},"os":"macOS","InTheBox":["Case","Solo Loop","1m Magnetic Charging Cable"],"orderInfo":{"inStock":90,"reviews":458}},{"id":14,"category":"Watch","imgUrl":"items/apple-watch-se.jpg","name":"Apple Watch Series SE","display":1.73228,"color":["Silver","Space Grey","Gold","Blue","Graphite"],"price":309,"chip":{"name":"S5 SiP   ","cores":null},"ram":null,"storage":22.1654,"touchId":false,"faceId":false,"wireless":["Wi-Fi","Bluetooth 5.0"],"camera":{"front":null,"back":null},"audio":{"microphone":"Dual microphones for calls, video recording, and audio recording","speakers":"Stereo speakers"},"size":{"height":"4,4","width":"3.8","depth":"0.6","weight":"1.07"},"os":"macOS","InTheBox":["Case","Band (can be configured for either S/M or M/L length)","1m Magnetic Charging Cable"],"orderInfo":{"inStock":79,"reviews":69}},{"id":15,"category":"Watch","imgUrl":"items/apple-watch3.jpg","name":"Apple Watch Series 3","display":22.1654,"color":["Silver","Space Grey","Gold","Blue","Graphite"],"price":309,"chip":{"name":"S5 SiP   ","cores":null},"ram":null,"storage":8,"touchId":false,"faceId":false,"wireless":["Wi-Fi","Bluetooth 5.0"],"camera":{"front":null,"back":null},"audio":{"microphone":"Dual microphones for calls, video recording, and audio recording","speakers":"Stereo speakers"},"size":{"height":"4,2","width":"3.3","depth":"0.6","weight":"1.07"},"os":"macOS","InTheBox":["Case","Band (can be configured for either S/M or M/L length)","1m Magnetic Charging Cable"],"orderInfo":{"inStock":47,"reviews":93}},{"id":16,"category":"iphone","imgUrl":"items/iphone_12.jpg","name":"IPhone 12","display":6.1,"color":["Black","White","Green","Blue","Red"],"price":799,"chip":{"name":"A14","cores":null},"ram":null,"storage":128,"touchId":false,"faceId":true,"wireless":["Wi-Fi","Bluetooth 5.0","5G GSM/EDGE"],"camera":{"front":"720p FaceTime HD camera","back":"Dual 12MP camera system"},"audio":{"microphone":"Three-mic array with directional beamforming","speakers":"Stereo speakers"},"size":{"height":"14.6","width":"7.1","depth":"0.7","weight":"0.164"},"os":"IOS","InTheBox":["iPhone with iOS 14","USB-C to Lightning Cable","Documentation"],"orderInfo":{"inStock":73,"reviews":12}},{"id":17,"category":"iphone","imgUrl":"items/iphone_12.jpg","name":"IPhone 12","display":6.1,"color":["Black","White","Green","Blue","Red"],"price":899,"chip":{"name":"A14","cores":null},"ram":null,"storage":256,"touchId":false,"faceId":true,"wireless":["Wi-Fi","Bluetooth 5.0","5G GSM/EDGE"],"camera":{"front":"720p FaceTime HD camera","back":"Dual 12MP camera system"},"audio":{"microphone":"Three-mic array with directional beamforming","speakers":"Stereo speakers"},"size":{"height":"14.6","width":"7.1","depth":"0.7","weight":"0.164"},"os":"IOS","InTheBox":["iPhone with iOS 14","USB-C to Lightning Cable","Documentation"],"orderInfo":{"inStock":0,"reviews":73}},{"id":18,"category":"iphone","imgUrl":"items/iphone_12.jpg","name":"IPhone 12 Mini","display":5.4,"color":["Black","White","Green","Blue","Red"],"price":669,"chip":{"name":"A14","cores":null},"ram":null,"storage":128,"touchId":false,"faceId":true,"wireless":["Wi-Fi","Bluetooth 5.0","5G GSM/EDGE"],"camera":{"front":"720p FaceTime HD camera","back":"Dual 12MP camera system"},"audio":{"microphone":"Three-mic array with directional beamforming","speakers":"Stereo speakers"},"size":{"height":"13.1","width":"6.41","depth":"0.7","weight":"0.135"},"os":"IOS","InTheBox":["iPhone with iOS 14","USB-C to Lightning Cable","Documentation"],"orderInfo":{"inStock":43,"reviews":100}},{"id":19,"category":"iphone","imgUrl":"items/iphone-12-pro.jpeg","name":"IPhone 12 Pro","display":6.1,"color":["Silver","Graphite","Gold","Pacific Blue"],"price":999,"chip":{"name":"A14","cores":null},"ram":null,"storage":256,"touchId":false,"faceId":true,"wireless":["Wi-Fi","Bluetooth 5.0","5G GSM/EDGE"],"camera":{"front":"720p FaceTime HD camera","back":"Pro 12MP camera system"},"audio":{"microphone":"Three-mic array with directional beamforming","speakers":"Stereo speakers"},"size":{"height":"14.6","width":"7.1","depth":"0.7","weight":"0.164"},"os":"IOS","InTheBox":["iPhone with iOS 14","USB-C to Lightning Cable","Documentation"],"orderInfo":{"inStock":84,"reviews":99}},{"id":20,"category":"iphone","imgUrl":"items/iphone-12-pro.jpeg","name":"IPhone 12 Pro","display":6.1,"color":["Silver","Graphite","Gold","Pacific Blue"],"price":1099,"chip":{"name":"A14","cores":null},"ram":null,"storage":512,"touchId":false,"faceId":true,"wireless":["Wi-Fi","Bluetooth 5.0","5G GSM/EDGE"],"camera":{"front":"720p FaceTime HD camera","back":"Pro 12MP camera system"},"audio":{"microphone":"Three-mic array with directional beamforming","speakers":"Stereo speakers"},"size":{"height":"14.6","width":"7.1","depth":"0.7","weight":"0.164"},"os":"IOS","InTheBox":["iPhone with iOS 14","USB-C to Lightning Cable","Documentation"],"orderInfo":{"inStock":2,"reviews":99}},{"id":21,"category":"iphone","imgUrl":"items/iphone-12-pro.jpeg","name":"IPhone 12 Pro Max","display":6.7,"color":["Silver","Graphite","Gold","Pacific Blue"],"price":1099,"chip":{"name":"A14","cores":null},"ram":null,"storage":256,"touchId":false,"faceId":true,"wireless":["Wi-Fi","Bluetooth 5.0","5G GSM/EDGE"],"camera":{"front":"720p FaceTime HD camera","back":"Pro 12MP camera system"},"audio":{"microphone":"Three-mic array with directional beamforming","speakers":"Stereo speakers"},"size":{"height":"16.0","width":"7.8","depth":"0.7","weight":"0.228"},"os":"IOS","InTheBox":["iPhone with iOS 14","USB-C to Lightning Cable","Documentation"],"orderInfo":{"inStock":5,"reviews":100}},{"id":22,"category":"iphone","imgUrl":"items/iphone-se.jpeg","name":"IPhone SE","display":4.7,"color":["Black","White","Red"],"price":1099,"chip":{"name":"A13","cores":null},"ram":null,"storage":128,"touchId":false,"faceId":true,"wireless":["Wi-Fi","Bluetooth 5.0","5G GSM/EDGE"],"camera":{"front":"720p FaceTime HD camera","back":"12MP Wide camera"},"audio":{"microphone":"Three-mic array with directional beamforming","speakers":"Stereo speakers"},"size":{"height":"13.8","width":"7.7","depth":"0.7","weight":"0.148"},"os":"IOS","InTheBox":["iPhone with iOS 14","USB-C to Lightning Cable","Documentation"],"orderInfo":{"inStock":81,"reviews":73}},{"id":23,"category":"iphone","imgUrl":"items/iphone11.jpeg","name":"IPhone 11","display":6.1,"color":["Black","Green","Yellow","Purple","White","Red"],"price":899,"chip":{"name":"A13","cores":null},"ram":null,"storage":256,"touchId":false,"faceId":true,"wireless":["Wi-Fi","Bluetooth 5.0","5G GSM/EDGE"],"camera":{"front":"720p FaceTime HD camera","back":"Dual 12MP Ultra Wide and Wide cameras"},"audio":{"microphone":"Three-mic array with directional beamforming","speakers":"Stereo speakers"},"size":{"height":"15.0","width":"7.5","depth":"0.8","weight":"0.194"},"os":"IOS","InTheBox":["iPhone with iOS 14","USB-C to Lightning Cable","Documentation"],"orderInfo":{"inStock":98,"reviews":100}},{"id":24,"category":"iphone","imgUrl":"items/iphone11.jpeg","name":"IPhone 11","display":6.1,"color":["Black","Green","Yellow","Purple","White","Red"],"price":999,"chip":{"name":"A13","cores":null},"ram":null,"storage":512,"touchId":false,"faceId":true,"wireless":["Wi-Fi","Bluetooth 5.0","5G GSM/EDGE"],"camera":{"front":"720p FaceTime HD camera","back":"Triple 12MP Ultra Wide and Wide cameras"},"audio":{"microphone":"Three-mic array with directional beamforming","speakers":"Stereo speakers"},"size":{"height":"15.0","width":"7.5","depth":"0.8","weight":"0.194"},"os":"IOS","InTheBox":["iPhone with iOS 14","USB-C to Lightning Cable","Documentation"],"orderInfo":{"inStock":115,"reviews":100}},{"id":25,"category":"iphone","imgUrl":"items/iphone11.jpeg","name":"IPhone 11","display":6.1,"color":["Black","Green","Yellow","Purple","White","Red"],"price":899,"chip":{"name":"A13","cores":null},"ram":null,"storage":256,"touchId":false,"faceId":true,"wireless":["Wi-Fi","Bluetooth 5.0","5G GSM/EDGE"],"camera":{"front":"720p FaceTime HD camera","back":"Triple 12MP Ultra Wide and Wide cameras"},"audio":{"microphone":"Three-mic array with directional beamforming","speakers":"Stereo speakers"},"size":{"height":"15.0","width":"7.5","depth":"0.8","weight":"0.194"},"os":"IOS","InTheBox":["iPhone with iOS 14","USB-C to Lightning Cable","Documentation"],"orderInfo":{"inStock":0,"reviews":100}},{"id":26,"category":"iphone","imgUrl":"items/iphone-xr.jpg","name":"IPhone XR","display":6.1,"color":["Black","Coral","Yellow","Blue","White","Red"],"price":699,"chip":{"name":"A12","cores":null},"ram":null,"storage":64,"touchId":false,"faceId":true,"wireless":["Wi-Fi","Bluetooth 5.0","FDD‑LTE GSM/EDGE"],"camera":{"front":"720p FaceTime HD camera","back":"12MP Wide camera"},"audio":{"microphone":"Three-mic array with directional beamforming","speakers":"Stereo speakers"},"size":{"height":"15.0","width":"7.5","depth":"0.8","weight":"0.194"},"os":"IOS","InTheBox":["iPhone with iOS 14","USB-C to Lightning Cable","Documentation"],"orderInfo":{"inStock":23,"reviews":86}},{"id":27,"category":"iphone","imgUrl":"items/iphone-xs.jpg","name":"IPhone XS","display":5.8,"color":["White","Rose Gold","Space Grey"],"price":699,"chip":{"name":"A12","cores":null},"ram":null,"storage":128,"touchId":false,"faceId":true,"wireless":["Wi-Fi","Bluetooth 5.0","FDD‑LTE GSM/EDGE"],"camera":{"front":"720p FaceTime HD camera","back":"12MP Wide camera"},"audio":{"microphone":"Three-mic array with directional beamforming","speakers":"Stereo speakers"},"size":{"height":"14.3","width":"7.0","depth":"0.7","weight":"0.177"},"os":"IOS","InTheBox":["iPhone with iOS 12","USB-A to Lightning Cable","Documentation"],"orderInfo":{"inStock":34,"reviews":94}},{"id":28,"category":"iphone","imgUrl":"items/iphone-xs.jpg","name":"IPhone XS","display":5.8,"color":["White","Rose Gold","Space Grey"],"price":799,"chip":{"name":"A12","cores":null},"ram":null,"storage":256,"touchId":false,"faceId":true,"wireless":["Wi-Fi","Bluetooth 5.0","FDD‑LTE GSM/EDGE"],"camera":{"front":"720p FaceTime HD camera","back":"12MP Wide camera"},"audio":{"microphone":"Three-mic array with directional beamforming","speakers":"Stereo speakers"},"size":{"height":"14.3","width":"7.0","depth":"0.7","weight":"0.177"},"os":"IOS","InTheBox":["iPhone with iOS 12","USB-A to Lightning Cable","Documentation"],"orderInfo":{"inStock":0,"reviews":94}},{"id":29,"category":"tv","imgUrl":"items/apple-tv.jpeg","name":"Apple TV 4K","display":null,"color":["Black"],"price":179,"chip":{"name":"A10X","cores":null},"ram":null,"storage":32,"touchId":false,"faceId":false,"wireless":["Wi-Fi","Bluetooth 5.0"],"camera":null,"audio":null,"size":{"height":"3.5","width":"9.8","depth":"3.5","weight":"0.425"},"os":"tvOS","InTheBox":["Apple TV 4K","Siri Remote","Power cord","Lightning to USB cable","Documentation"],"orderInfo":{"inStock":2,"reviews":99}},{"id":30,"category":"tv","imgUrl":"items/apple-tv.jpeg","name":"Apple TV 4K","display":null,"color":["Black"],"price":199,"chip":{"name":"A10X","cores":null},"ram":null,"storage":64,"touchId":false,"faceId":false,"wireless":["Wi-Fi","Bluetooth 5.0"],"camera":null,"audio":null,"size":{"height":"3.5","width":"9.8","depth":"3.5","weight":"0.425"},"os":"tvOS","InTheBox":["Apple TV 4K","Siri Remote","Power cord","Lightning to USB cable","Documentation"],"orderInfo":{"inStock":1,"reviews":100}},{"id":31,"category":"airpods","imgUrl":"items/airpods.jpg","name":"AirPods","display":null,"color":["White"],"price":199,"chip":{"name":"H!","cores":null},"ram":null,"storage":null,"touchId":false,"faceId":false,"wireless":["Bluetooth 5.0"],"camera":null,"audio":{"microphone":"Three-mic array with directional beamforming","speakers":"Stereo speakers"},"size":{"height":"5.3","width":"4.4","depth":"0.2","weight":"0.04"},"os":null,"InTheBox":["AirPods","Wireless Charging Case","Lightning to USB-A Cable","Documentation"],"orderInfo":{"inStock":23,"reviews":100}},{"id":32,"category":"airpods","imgUrl":"items/airpods_pro.jpg","name":"AirPods Pro","display":null,"color":["White"],"price":299,"chip":{"name":"H!","cores":null},"ram":null,"storage":null,"touchId":false,"faceId":false,"wireless":["Bluetooth 5.0"],"camera":null,"audio":{"microphone":"Three-mic array with directional beamforming","speakers":"Stereo speakers"},"size":{"height":"4.5","width":"6.0","depth":"0.21","weight":"0.04"},"os":null,"InTheBox":["AirPods Pro","Wireless Charging Case","Lightning to USB-C Cable","Documentation","Silicone ear tips (three sizes)"],"orderInfo":{"inStock":29,"reviews":94}},{"id":33,"category":"airpods","imgUrl":"items/airpods-max.jpg","name":"AirPods Max","display":null,"color":["White"],"price":599,"chip":{"name":"H!","cores":null},"ram":null,"storage":null,"touchId":false,"faceId":false,"wireless":["Bluetooth 5.0"],"camera":null,"audio":{"microphone":"Three-mic array with directional beamforming","speakers":"Stereo speakers"},"size":{"height":"18.7","width":"16.8","depth":"8.3","weight":"0.38"},"os":null,"InTheBox":["AirPods MAx","Smart Case","Lightning to USB-C Cable","Documentation"],"orderInfo":{"inStock":0,"reviews":5}}]
console.log(data)

const Price = ({children}) =>
<section className='Price'>$ {children}</section>

const Colors = ({colors}) =>
<ul className='Color'>
    {colors.map(color => <li>{color}</li>)}
</ul>

const Product = ({product: {id, category, imgUrl, name, display, price, color, ram, storage}}) => 
<div className='Product'>
    <h2>{category}: {name} {display && display.toFixed(2)}"</h2>
    <Price>{price}</Price>
    Color: <Colors colors={color} />
</div>

const Products = ({products}) => 
<div className='Products'>
    {products ? products.map(product => <Product product={product} />) : "LOADING"}
</div>

const CProducts = connect(state => ({products: state.shopItems.payload}))(Products)


class ClassCounter extends React.Component { //обязательно отнаследоваться от React.Component
    state = {counter: 0} 

    componentWillMount(){
        console.log('К: я ща рожусь')
    }


    render(){
        const {state: {counter}} = this
        console.log('К: я рисуюсь')
        return <div>какой-то классовый компонент: {counter}</div>
    }

    componentDidMount(){
        console.log('К: я уже родился')
        this.interval = setInterval(() => this.setState({counter: this.state.counter +1}), this.props.ms)
    }

    componentWillUnmount(){
        console.log('К: я ща умру')
        clearInterval(this.interval)
    }
    




    shouldComponentUpdate(){
        console.log('обновляцца надо???')
        return Math.random() > 0.1
    }

    componentWillUpdate(){
        console.log('К: я ща обновлюсь')
    }

    componentDidUpdate({ms}){
        console.log('К: я тока шо обновился')
        if (ms !== this.props.ms){
            this.componentWillUnmount()
            this.componentDidMount()
        }
    }
}

const FunctionCounter = ({ms, onDelete}) => {
    const [counter, setCounter] = useState(0)
    useEffect(() => { //componentDidMount
        console.log('Ф: я уже родился')
        const interval = setInterval(() => setCounter(counter => counter +1), ms)
        return () => { //componentWillUnmount
            console.log('Ф: я ща умру, или перерожусь как кошки')
            clearInterval(interval)
        }
    },[ms]) //если с массивом - didmount, 
    //если с непустым массивом - то по любому изменению любого элемента в массиве

    useEffect(() => { //componentDidUpdate
        console.log('Ф: я тока шо обновился')
    }) //если без второго параметра useEffect - didupdate
    console.log('Ф: я рисуюсь')

    return <div>какой-то функциональный компонент: <input value={counter}/><button onClick={onDelete}>x</button></div>
}


function App() {
    const [show, setShow] = useState(true)
    const [ms, setMS] = useState(2000)
    const [counters, setCounters] = useState([])
    console.log(counters)
    return (
      <>
        <button onClick={() => setMS(ms +100)}>+</button>{ms}<button onClick={() => setMS(ms -100)}>-</button>
        <button onClick={() => setShow(!show)}>toggle</button>
        {show && <>
            {/*  <ClassCounter ms={ms}/>
                    <FunctionCounter ms={ms}/> */ }
                 </>
        }
        <br/>
        <button onClick={() => setCounters([Math.random(), ...counters])}>+</button>
        {counters.map((item, i) => <FunctionCounter ms={ms} key={item} onDelete={() => setCounters(counters.filter(x => item !== x))}/>)}
      </>
    );
}

export default App;
