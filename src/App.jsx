import './App.css';
import Navbar from './components/Navbar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConnectWalletModal from './kda-wallet/components/ConnectWalletModal';
import FlexColumn from './components/FlexColumn';
import FlexRow from './components/FlexRow';
// import MonacoEditor from '@uiw/react-monacoeditor';
import CustomButton from './components/CustomButton';
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { local, setNetwork, setNetworkId, signAndSend } from './kda-wallet/store/kadenaSlice';
import { txToastManager, messageToastManager, walletConnectedToastManager } from './components/TxToastManager';
import TxRender from './components/TxRender';
import pactLanguageSpec from './constants/pactLanguageSpec';
import Editor from "@monaco-editor/react";

export default function App() {
  const dispatch = useDispatch();
  const network = useSelector(state => state.kadenaInfo.network);
  const networkId = useSelector(state => state.kadenaInfo.networkId);
  const transactions = useSelector(state => state.kadenaInfo.transactions);
  const account = useSelector(state => state.kadenaInfo.account);

  // Setup the pact editor and language
  const editorRef = useRef(null);
  const pactEditorDidMount = (editor, monaco) => {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
    monaco.languages.register({
        id: 'pact'
    });
    
    monaco.languages.setMonarchTokensProvider('pact', pactLanguageSpec);
  }

  const [txRenders, setTxRenders] = useState([]);

  const [code, setCode] = useState('');
  const [envData, setEnvData] = useState('');
  // const [caps, setCaps] = useState('');
  const [chainId, setChainId] = useState('1');
  const [gasLimit, setGasLimit] = useState(15000);
  const [gasPrice, setGasPrice] = useState(1e-5);
  const [localOrSend, setLocalOrSend] = useState('local');

  const pactEditorChanged = (value, event) => {
    setCode(value);
  }
  const envDataEditorChanged = (value, event) => {
    setEnvData(JSON.parse(value));
  }
  const envDataErrors = (markers) => {
    markers.forEach(marker => console.log('onValidate:', marker.message));
  }
  // const capsEditorChanged = (value, event) => {
  //   setCaps(value);
  // }

  const onInputChanged = (value) => {
    let id = value.target.id;
    if (id === 'chainId') {
      setChainId(value.target.value);
    }
    else if (id === 'network') {
      dispatch(setNetwork(value.target.value));
    }
    else if (id === 'networkId') {
      dispatch(setNetworkId(value.target.value));
    }
    else if (id === 'gasLimit') {
      setGasLimit(Number(value.target.value));
    }
    else if (id === 'gasPrice') {
      setGasPrice(Number(value.target.value));
    }
    else if (id === 'localOrSend') {
      setLocalOrSend(value.target.value);
    }
  }

  useEffect(() => {
    // console.log('txs updated');
    // console.log(transactions.length);
    let renders = [];
    for (var i = transactions.length - 1; i >= 0; i--) {
      // console.log(transactions[i]);
      renders.push(<TxRender key={i} txData={transactions[i]}/>);
    }
    setTxRenders(renders);
  }, [transactions]);

  const [keysPressed, setKeysPressed] = useState({
    'Control': false,
    'Meta': false,
    'r': false,
  });

  useEffect(() => {
    const keyDownHandler = event => {
      // console.log('pressed', event.key);
      let key = event.key;
      setKeysPressed({
        ...keysPressed,
        [key]: true,
      })
    }
    const keyUpHandler = event => {
      // console.log('unpressed', event.key);
      let key = event.key;
      setKeysPressed({
        ...keysPressed,
        [key]: false,
      })
    }

    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);

    return () => {
      document.removeEventListener('keydown', keyDownHandler);
      document.removeEventListener('keyup', keyUpHandler);
    }
  })

  useEffect(() => {
    // console.log(keysPressed);
    if (keysPressed.Control && keysPressed.r) {
      setKeysPressed({
        ...keysPressed,
        'Control': false,
        'r': false,
      })
      // console.log('running');
      runCommand();
    }
  }, [keysPressed]);


  //// Local Update Timer ////
  var timer
  const [localTx, setLocalTx] = useState({});

  const updateLocal = async () => {
    let res = await dispatch(local(chainId, code, envData, [], gasLimit, gasPrice, true));
    setLocalTx(res);
  }

  // Immediate update when basic values change
  useEffect(() => {
    updateLocal();
  }, [network, networkId, chainId, gasLimit, gasPrice]);

  // Wait for a few seconds after typing to send the local command.
  useEffect(() => {
    if (timer) {
      clearInterval(timer);
    }
    timer = setInterval(() => { 
      updateLocal();
      clearInterval(timer);
    }, 1500);
    return () => {
      clearInterval(timer);
    }
  }, [code, envData])


  const runCommand = () => {
    // console.log(gasLimit, gasPrice);
    // if (localOrSend === 'local') {
    //   dispatch(local(chainId, code, envData, [], gasLimit, gasPrice));
    // }
    // else {
    // }
    dispatch(signAndSend(chainId, code, envData, [], gasLimit, gasPrice));
  }



  return (
    <div className="w-full flex flex-col items-center bg-slate-600">
      <div className="w-full max-w-5xl h-min min-h-screen flex flex-col text-white text-center">
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <ConnectWalletModal 
          onNewTransaction={txToastManager}
          onNewMessage={messageToastManager}
          onWalletConnected={walletConnectedToastManager}
          buttonStyle="`border-white border-2 rounded-md h-auto px-10 py-2 hover:border-purple-300 active:border-purple-700 focus:border-purple-500 transition duration-150 ease-out"
        />
        <Navbar />
        <FlexColumn className='p-2 space-y-4'>
          <FlexRow className='h-auto text-left gap-2'>
            <FlexColumn className='flex-1'>
              <span>Chain ID:</span>
              <input 
                id="chainId"
                defaultValue="1"
                className='flex-auto bg-black rounded-md border-white border-2 p-1'
                onChange={onInputChanged}/>
            </FlexColumn>
            <FlexColumn className='flex-1'>
              <span>Network:</span>
              <select 
                id="network" 
                defaultValue="https://api.testnet.chainweb.com" 
                className='flex-auto bg-black rounded-md border-white border-2 p-1' 
                onChange={onInputChanged}
              >
                <option value="https://api.testnet.chainweb.com">https://api.testnet.chainweb.com</option>
                <option value="https://api.chainweb.com">https://api.chainweb.com</option>
              </select>
            </FlexColumn>
            <FlexColumn className='flex-1'>
              <span>Network ID:</span>
              <select 
                id="networkId" 
                defaultValue="testnet04" 
                className='flex-auto bg-black rounded-md border-white border-2 p-1' 
                onChange={onInputChanged}
              >
                <option value="testnet04">testnet04</option>
                <option value="mainnet01">mainnet01</option>
              </select>
            </FlexColumn>
          </FlexRow>
          <FlexRow className='h-auto text-left gap-2'>
            <FlexColumn className='flex-1'>
              <span>Gas Limit:</span>
              <input 
                id="gasLimit"
                type="number"
                defaultValue="15000"
                className='flex-auto bg-black rounded-md border-white border-2 p-1'
                onChange={onInputChanged}/>
            </FlexColumn>
            <FlexColumn className='flex-1'>
              <span>Gas Price:</span>
              <input 
                id="gasPrice"
                // type="number"
                defaultValue="1e-5"
                className='flex-auto bg-black rounded-md border-white border-2 p-1'
                onChange={onInputChanged}/>
            </FlexColumn>
          </FlexRow>
          <FlexRow className='h-auto text-left space-x-2'>
            <span>Account:</span>
            <span>{account}</span>
          </FlexRow>
          <FlexColumn className='text-left space-y-2'>
            <span className='text-2xl'>Env Data:</span>
            <div className='rounded-lg overflow-hidden'>
              {/* <MonacoEditor
                ref={editorRef}
                height="100px"
                language="json"
                options={{
                  theme: 'vs-dark',
                  selectOnLineNumbers: true,
                  roundedSelection: false,
                  cursorStyle: 'line',
                  automaticLayout: false,
                }}
                onChange={envDataEditorChanged}
                // editorDidMount={envDataEditorDidMount}
              /> */}
              <Editor
                height="100px"
                defaultLanguage="json"
                defaultValue=""
                theme='vs-dark'
                onChange={envDataEditorChanged}
                onValidate={envDataErrors}
              />
            </div>
          </FlexColumn>
          <FlexColumn className='h-auto text-left space-y-2'>
            <span className='text-2xl'>Code:</span>
            <div className='rounded-lg overflow-hidden'>
              <Editor
                height="250px"
                defaultLanguage="pact"
                defaultValue=""
                theme='vs-dark'
                onMount={pactEditorDidMount}
                onChange={pactEditorChanged}
              />
              {/* <MonacoEditor
                id="code"
                height="250px"
                language="pact"
                value='(coin.get-balance "Hello")'
                options={{
                  theme: 'vs-dark',
                }}
                onChange={pactEditorChanged}
                editorDidMount={pactEditorDidMount}
              /> */}
            </div>
            <FlexRow className='space-x-2'>
              <TxRender className='flex-1' txData={localTx}/>
              <CustomButton
                text="Send (Control + r)"
                onClick={runCommand}  
              />
            </FlexRow>
          </FlexColumn>
          <FlexColumn className='text-left space-y-2'>
            <span className='text-2xl'>Transactions:</span>
            {txRenders.length === 0 ? <span>None</span> : txRenders}
          <div className='h-40'/>
          </FlexColumn>
          {/* <FlexColumn className='text-left space-y-2'>
            <span className='text-2xl'>Caps</span>
            <div className='rounded-lg overflow-hidden'>
              <MonacoEditor
                height="100px"
                language="json"
                value=''
                options={{
                  theme: 'vs-dark',
                }}
                onChange={capsEditorChanged}
                // editorDidMount={capsEditorDidMount}
              />
            </div>
          </FlexColumn> */}
        </FlexColumn>
      </div>
    </div>
  )
}
