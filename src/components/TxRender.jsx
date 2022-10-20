import { useState } from "react";

function TxRender(props) {

  const createTxStructure = (txData) => {
    // console.log('txData');
    // console.log(txData);
    var res, txResult, data;
    // If the tx result is empty, we are listening
    if (typeof(txData.result) === 'undefined') {
      txResult = 'Result';
      data = 'Listening...';
    }
    else { // Otherwise, load the data in
      res = txData.result;
      txResult = res.status === 'success' ? 'Result' : 'Error';
      data = res.status === 'success' ? JSON.stringify(res.data) : JSON.stringify(res.error);
    }
    
    return (
      <div className="bg-slate-900 rounded-md p-2">
        <span className="break-all">TX ID: {props.txData.reqKey}</span>
        <br></br>
        <span className="break-all">TX {txResult}: {data}</span>
      </div>
    )
  }

  var structure
  if (typeof(props.txData) === 'string') {
    structure = (
      <div className="bg-slate-900 rounded-md p-2">
        <span>Error</span>
        <br></br>
        <span className="break-all">{props.txData}</span>
      </div>
    );
  }
  else if ('listenPromise' in props.txData) {
    const [txData, setTxData] = useState(props.txData);

    const updateOnReturn = async () => {
      let res = await props.txData.listenPromise;
      // console.log(res);
      setTxData(res);
    }
    updateOnReturn();

    structure = createTxStructure(txData);
  }
  else {
    structure = createTxStructure(props.txData);
  }

  return structure;
}

export default TxRender
