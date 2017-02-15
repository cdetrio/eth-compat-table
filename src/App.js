import React, { Component } from 'react';
import Collapse, { Panel } from 'rc-collapse';
import _ from 'lodash';

import './collapse.css';
import './button.css';
import './App.css';


let CLIENT_NAMES = [];
let CLIENT_METAINFO = [];

function processRpcTestData(rpc_test_data) {
  let client_testresults = [];

  _.forEach(rpc_test_data.simulations, (val, key) => {
    console.log("val['ethereum/rpeecee']:", val['ethereum/rpeecee']);
    // start, end, success, subresults

    let meta_info = {
      'start': val['ethereum/rpeecee'].start,
      'end': val['ethereum/rpeecee'].end
    };
    CLIENT_METAINFO.push(meta_info);
    client_testresults.push(val['ethereum/rpeecee'].subresults);
    CLIENT_NAMES.push(key);
  });

  console.log('CLIENT_NAMES:', CLIENT_NAMES);

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
        {CLIENT_NAMES[clientIndex]}
        <br/>
        <span className="testTimeInfo">
          <a href={`${client_prefix}-client.log`}>client log</a>
          &nbsp;&nbsp;
          <a href={`${client_prefix}-simulator.log`}>test-runner log</a>
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
        return (
          <div className="header columnHeader" key={key_i}>
            <span className="clientColSpan">
              {client_name}
            </span>
            <div className={logo_icon}></div>
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
          {testObj.success ? 'Yes' : 'No'}
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
  let passing_counts = [0, 0, 0];
  const testItems = groupTestCases.map(test_obj => {
    //console.log('test case:', test_obj);
    test_item_i += 1;

    _.forEach(test_obj, function(result, t_i) {
      if (result.success === true) {
        passing_counts[t_i] += 1;
      }
    });


    const test_itemrow_html = (
        <div className="testItem" key={test_item_i}>
          <div className="testItemText testName titleColumn">
            <span className="testNameTitle">
              {test_obj[0].name}
            </span>
          </div>

          <ClientTestResult clientIndex={0} testObj={test_obj[0]} testKey={test_item_i+'-0'} />
          <ClientTestResult clientIndex={1} testObj={test_obj[1]} testKey={test_item_i+'-1'} />
          <ClientTestResult clientIndex={2} testObj={test_obj[2]} testKey={test_item_i+'-2'} />

        </div>
    );

    return test_itemrow_html;
  });


  let group_scores = [];
  group_scores[0] = groupScore(passing_counts[0], testCount);
  group_scores[1] = groupScore(passing_counts[1], testCount);
  group_scores[2] = groupScore(passing_counts[2], testCount)


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

         <div className={`titleCell ${group_scores[0]}`}>{passing_counts[0]}/{testCount}</div>
         <div className={`titleCell ${group_scores[1]}`}>{passing_counts[1]}/{testCount}</div>
         <div className={`titleCell ${group_scores[2]}`}>{passing_counts[2]}/{testCount}</div>
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
    console.log('change activeItemKey:', activeItemKey);
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


    return (
      <div className="App">


        <div className="App-header">

          <div className="headerLogo">
            <img src="ETHEREUM-ICON_Black.png" className="App-logo" alt="logo" />
            <h2>Ethereum client RPC API compatibility table</h2>
          </div>

          <div className="testMetaInfo">
            <h4>
              Test harness: <a href="https://github.com/cdetrio/hive/tree/6d2d48f7f1e9ba19f9e8c17de735ecdb6e672edd/simulators/ethereum/rpeecee">Hive @6d2d48f</a>
              <br/>
              RPC test suite: <a href="https://github.com/cdetrio/interfaces/tree/master/rpc-specs-tests">v0.0.1</a>
            </h4>

            <ClientMetaInfo clientIndex={0} />
            <br/>
            <ClientMetaInfo clientIndex={1} />
            <br/>
            <ClientMetaInfo clientIndex={2} />
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
