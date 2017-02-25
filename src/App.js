import React, { Component } from 'react';
import Collapse, { Panel } from 'rc-collapse';
import { Textfit } from 'react-textfit';

import _ from 'lodash';

import './collapse.css';
import './button.css';
import './App.css';


let CLIENT_NAMES = [];
let CLIENT_METAINFO = [];

// github stats as of 2-24-2017
const CLIENT_GITHUB_STARS = {
  'cpp-ethereum': 838,
  'go-ethereum': 3016,
  'pyethereum': 698,
  'parity': 801
};

const CLIENT_NAMES_SHORT = {
  'cpp-ethereum': 'cpp-eth',
  'go-ethereum': 'go-eth',
  'pyethereum': 'pyeth',
  'parity': 'parity'
};


const CLIENT_URLS = {
  'cpp-ethereum:develop': 'https://github.com/ethereum/cpp-ethereum/tree/develop',
  'go-ethereum:master': 'https://github.com/ethereum/go-ethereum/tree/master',
  'go-ethereum:storage-at': 'https://github.com/fjl/go-ethereum/tree/storage-at',
  'pyethereum:develop': 'https://github.com/ethereum/pyethereum/tree/develop',
  'parity:master': 'https://github.com/ethcore/parity/tree/master'
};


function sortClientNames(rpc_test_data) {
  let client_names = _.keys(rpc_test_data.simulations);

  let sorted_client_names = _.sortBy(client_names, function (name) {
    const name_canon = name.split(':')[0]; // clip name after colon
    if (_.has(CLIENT_GITHUB_STARS, name_canon)) {
      return -1 * CLIENT_GITHUB_STARS[name_canon];
    } else {
      console.log('couldnt find github stats for '+name_canon+' to sort by rank.');
      return 0;
    }
  });

  return sorted_client_names;
}


function processRpcTestData(rpc_test_data) {
  let client_testresults = [];

  CLIENT_NAMES = sortClientNames(rpc_test_data);
  console.log('CLIENT_NAMES:', CLIENT_NAMES);

  CLIENT_METAINFO = new Array(CLIENT_NAMES.length);

  _.forEach(rpc_test_data.simulations, (val, key) => {
    // val['ethereum/rpeecee'] has keys: start, end, success, subresults
    console.log(key, "val['ethereum/rpeecee']:", val['ethereum/rpeecee']);

    const client_index = CLIENT_NAMES.indexOf(key);

    let meta_info = {
      'start': val['ethereum/rpeecee'].start,
      'end': val['ethereum/rpeecee'].end
    };
    CLIENT_METAINFO[client_index] = meta_info;

    // TODO: should check if the subresults have the same length
    // to ensure all clients have a result for all test cases

    client_testresults[client_index] = val['ethereum/rpeecee'].subresults;
  });


  console.log('client_testresults:', client_testresults);

  let combined_results = _.zip(...client_testresults);
  //console.log('combined_results:', combined_results);
  // combined_results[0] = [
  //  {subresult.name, subresult.success, subresult.error, subresult.details},
  //  {subresult.name, subresult.success, subresult.error, subresult.details}
  //]
  // combined_results[1] = [
  //  {subresult.name, subresult.success, subresult.error, subresult.details},
  //  {subresult.name, subresult.success, subresult.error, subresult.details}
  //]

  // combined_results[0][0] is test case 0 for client_names[0]
  // combined_results[0][1] is test case 0 for client_names[1]

  // combined_results[1][0] is test case 1 for client_names[0]
  // combined_results[1][1] is test case 1 for client_names[1]

  let testCombinedGroups = _.groupBy(combined_results, (subres) => {
    const group_name = subres[0].name.split(' ')[0];
    //console.log('grouping by:', group_name);
    // test case name for client [0] should be equal to test case names for other clients
    return group_name;
  });

  return testCombinedGroups;
}



class ClientMetaInfo extends Component {


  render() {
    const clientIndex = this.props.clientIndex;

    if (_.isUndefined(CLIENT_METAINFO[clientIndex])) {
      return (<div></div>);
    }

    const client_prefix = CLIENT_NAMES[clientIndex].replace(':', '-');

    return (
      <div>
        <a href={CLIENT_URLS[CLIENT_NAMES[clientIndex]]}>
          {CLIENT_NAMES[clientIndex]}
        </a>
        <br/>
        <span className="testTimeInfo">
          <a href={`clientlogs/${client_prefix}-client.log`}>client log</a>
          &nbsp;&nbsp;
          <a href={`clientlogs/${client_prefix}-simulator.log`}>test-runner log</a>
          <br/>
          start time: {CLIENT_METAINFO[clientIndex].start}
          <br/>
          end time: {CLIENT_METAINFO[clientIndex].end}
        </span>
      </div>
    );
  }

}





class TableHeader extends Component {

  render() {

    let key_i = 0;
    const client_column_headers_html =
      CLIENT_NAMES.map((client_name) => {
        key_i++;
        let logo_icon = '';
        if (client_name.includes('go-ethereum')) {
          logo_icon = 'logoIconGeth';
        }
        if (client_name.includes('parity')) {
          logo_icon = 'logoIconParity';
        }

        const clientName = client_name.split(':')[0];
        const clientBranch = client_name.split(':')[1];

        return (
          <div className="header columnHeader" key={key_i}>

            {/*
            <span className="clientColSpan">
              {clientName}
            </span>
            */}

            <div className="clientNameContainer">
              <Textfit mode="single" max={16}>
                {CLIENT_NAMES_SHORT[clientName]}
              </Textfit>
              <br/>
              <span className="clientBranch">
                {clientBranch}
              </span>

            </div>

            {/*
            <div className={logo_icon}></div>
            */}
          </div>
        );
      });

    return (
      <div>
        <div className="header titleHeader titleColumn">
          <div>
          <span className="headerText">Feature name (RPC API method)</span>
          <br/>
          <span className="headerSubtext">Test case name</span>
          </div>
        </div>

        {client_column_headers_html}

      </div>
    );
  }
}



class ClientTestResult extends Component {

  render() {

    const testObj = this.props.testObj;
    //console.log('testObj:', testObj);

    const pass_cell_html = (
      <div className={`testCell ${passOrFail(testObj.success)}`}>
        <div className={`${cssSuccess(testObj.success)}`}>
          {testObj.success ? '✓ Yes' : '✕ No'}
        </div>
      </div>
    );

    if (testObj.success === false) {
      let schema_exception = '';
      if (_.has(testObj.details, 'schemaException')) {
        schema_exception = testObj['details']['schemaException'];
      }
      const deets = _.omit(testObj.details, ['schemaException']);

      return (
        <Collapse className={'subCollapse'}
          key={this.props.testKey}
        >
          <Panel  header={pass_cell_html}
                  key={this.props.testKey}
                  showArrow={false}
                  className="itemPanel"
          >
            <div className="detailsContainer">

              <center>
                Test failure for {CLIENT_NAMES[this.props.clientIndex]}
              </center>

              {schema_exception.length > 0 &&
                <div>
                  Schema exception:
                  <pre>
                    {schema_exception}
                  </pre>
                  <hr/>
                </div>
              }

              <p>
                Error:
                <br/>
                {testObj.error}
              </p>

              <p>
                Details:
              </p>
              <pre>
                {JSON.stringify(deets, null, '  ')}
              </pre>
            </div>
          </Panel>
        </Collapse>
      );

    } else {
      return pass_cell_html;
    }

  }
}







function groupScore(passing_count, total_count) {
  let groupPassFail = 'pass';
  if (passing_count < total_count) {
    groupPassFail = 'passingSome';
  }
  if (passing_count < total_count*(2/3)) {
    groupPassFail = 'fail';
  }
  return groupPassFail;
}


function cssSuccess(test_success) {
  if (test_success === true) {
    return '';
  } else {
    return 'button -salmon';
  }
}


function passOrFail(test_success) {
  if (test_success === true) {
    return 'pass';
  } else {
    return 'fail';
  }
}


function featureGroupComponent(groupTestCases, groupName, key_id, parent) {

  const testCount = groupTestCases.length;

  let test_item_i = 0;
  let passing_counts = new Array(CLIENT_NAMES.length).fill(0);
  const testItems = groupTestCases.map(test_obj => {
    //console.log('test case:', test_obj);
    test_item_i += 1;

    _.forEach(test_obj, function(result, t_i) {
      if (result.success === true) {
        passing_counts[t_i] += 1;
      }
    });

    let ClientTestResultsHtml =
      CLIENT_NAMES.map( (client_name, client_index) => {
        return (
          <ClientTestResult clientIndex={client_index} key={client_index}
                            testObj={test_obj[client_index]}
                            testKey={test_item_i+'-'+client_index} />
        );
      });

    const test_itemrow_html = (
        <div className="testItem" key={test_item_i}>
          <div className="testItemText testName titleColumn">
            <span className="testNameTitle">
              {test_obj[0].name}
            </span>
          </div>

          {ClientTestResultsHtml}

        </div>
    );

    return test_itemrow_html;
  });


  let group_scores = CLIENT_NAMES.map( (client_name, client_index) => {
    return groupScore(passing_counts[client_index], testCount);
  });


  let ClientResultScores =
    CLIENT_NAMES.map( (client_name, client_index) => {
      return (
        <div className={`titleCell ${group_scores[client_index]}`} key={client_index}>
          {passing_counts[client_index]}/{testCount}
        </div>
      );
    });


  const testTitle = (
     <div className="testGroupHeader">
         <div className="testGroupName titleColumn">
           {groupName}
          <div className="expandArrow">
            <div className="groupExpandIndicator">
              ►
            </div>
          </div>
         </div>

         {ClientResultScores}
     </div>
  );



  return (
    <Panel header={testTitle} className="testGroupRow" showArrow={false} key={key_id}>
      {testItems}
    </Panel>
  );

}






class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      'testData': [],
      'activeItemKey': []
    };

  }


  onChangeItem(activeItemKey) {
    this.setState({
      'activeItemKey': activeItemKey
    });
  }


  componentDidMount() {
    fetch("simulator_log.json")
      .then( (response) => {
        return response.json();
      })
      .then( (json) => {
        console.log('got json response:', json);
        const rpcTestData = processRpcTestData(json);
        this.setState({'testData': rpcTestData});
      });

  }


  render() {
    console.log('render this.state:', this.state);

    const testCombinedGroups = this.state.testData;

    let test_counter = 0;
    let testDivs = _.map(testCombinedGroups, (test_cases, group_name) => {
      test_counter += 1;
      return featureGroupComponent(test_cases, group_name, test_counter, this);
    });

    let ClientMetaInfos = CLIENT_NAMES.map( (client_name, client_index) => {
      return (
        <div key={client_index}>
          <ClientMetaInfo clientIndex={client_index} />
          <br/>
        </div>
      );
    });

    //let ClientMetaInfosHtml = ClientMetaInfos.join((<br/>));


    return (
      <div className="App">


        <div className="App-header">

          <div className="headerLogo">
            <img src="ETHEREUM-ICON_Black.png" className="App-logo" alt="logo" />
            <h2>Ethereum client RPC API compatibility table</h2>
          </div>

          <div className="testMetaInfo">
            <h4>
              {/* track version of Hive used
              Test harness: <a href="https://github.com/karalabe/hive/tree/4c0f46b2da1b7db67d78e0c585cc845770314ff7">Hive @4c0f46b</a>
              */}
              Test harness: <a href="https://github.com/karalabe/hive/">Hive</a>
              <br/>
              RPC test suite: <a href="https://github.com/cdetrio/interfaces/tree/0fcb796440dea702e308710457346d29b051f365/rpc-specs-tests">v0.0.1</a>
            </h4>

            {ClientMetaInfos}
          </div>

        </div>


        <div className="accordionContainer">

          <TableHeader />

          <Collapse
            onChange={this.onChangeItem.bind(this)}
            activeKey={this.state.activeItemKey}
          >
            { testDivs }
          </Collapse>

        </div>


      </div>
    );
  }
}

export default App;
