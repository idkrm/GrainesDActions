import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'grainesdactions',
  location: 'us-east4'
};

export const createEcoActionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateEcoAction', inputVars);
}
createEcoActionRef.operationName = 'CreateEcoAction';

export function createEcoAction(dcOrVars, vars) {
  return executeMutation(createEcoActionRef(dcOrVars, vars));
}

export const listPublicEventsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPublicEvents');
}
listPublicEventsRef.operationName = 'ListPublicEvents';

export function listPublicEvents(dc) {
  return executeQuery(listPublicEventsRef(dc));
}

export const createTipRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateTip', inputVars);
}
createTipRef.operationName = 'CreateTip';

export function createTip(dcOrVars, vars) {
  return executeMutation(createTipRef(dcOrVars, vars));
}

export const getUserEcoActionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUserEcoActions', inputVars);
}
getUserEcoActionsRef.operationName = 'GetUserEcoActions';

export function getUserEcoActions(dcOrVars, vars) {
  return executeQuery(getUserEcoActionsRef(dcOrVars, vars));
}

