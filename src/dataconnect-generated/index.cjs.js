const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'grainesdactions',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createEcoActionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateEcoAction', inputVars);
}
createEcoActionRef.operationName = 'CreateEcoAction';
exports.createEcoActionRef = createEcoActionRef;

exports.createEcoAction = function createEcoAction(dcOrVars, vars) {
  return executeMutation(createEcoActionRef(dcOrVars, vars));
};

const listPublicEventsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPublicEvents');
}
listPublicEventsRef.operationName = 'ListPublicEvents';
exports.listPublicEventsRef = listPublicEventsRef;

exports.listPublicEvents = function listPublicEvents(dc) {
  return executeQuery(listPublicEventsRef(dc));
};

const createTipRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateTip', inputVars);
}
createTipRef.operationName = 'CreateTip';
exports.createTipRef = createTipRef;

exports.createTip = function createTip(dcOrVars, vars) {
  return executeMutation(createTipRef(dcOrVars, vars));
};

const getUserEcoActionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUserEcoActions', inputVars);
}
getUserEcoActionsRef.operationName = 'GetUserEcoActions';
exports.getUserEcoActionsRef = getUserEcoActionsRef;

exports.getUserEcoActions = function getUserEcoActions(dcOrVars, vars) {
  return executeQuery(getUserEcoActionsRef(dcOrVars, vars));
};
