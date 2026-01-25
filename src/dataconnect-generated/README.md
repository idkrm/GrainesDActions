# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListPublicEvents*](#listpublicevents)
  - [*GetUserEcoActions*](#getuserecoactions)
- [**Mutations**](#mutations)
  - [*CreateEcoAction*](#createecoaction)
  - [*CreateTip*](#createtip)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListPublicEvents
You can execute the `ListPublicEvents` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listPublicEvents(): QueryPromise<ListPublicEventsData, undefined>;

interface ListPublicEventsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPublicEventsData, undefined>;
}
export const listPublicEventsRef: ListPublicEventsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listPublicEvents(dc: DataConnect): QueryPromise<ListPublicEventsData, undefined>;

interface ListPublicEventsRef {
  ...
  (dc: DataConnect): QueryRef<ListPublicEventsData, undefined>;
}
export const listPublicEventsRef: ListPublicEventsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listPublicEventsRef:
```typescript
const name = listPublicEventsRef.operationName;
console.log(name);
```

### Variables
The `ListPublicEvents` query has no variables.
### Return Type
Recall that executing the `ListPublicEvents` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListPublicEventsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListPublicEventsData {
  events: ({
    id: UUIDString;
    title: string;
    description?: string | null;
    date: DateString;
    location: string;
    imageUrl?: string | null;
    organizer: {
      id: UUIDString;
      displayName: string;
      profilePictureUrl?: string | null;
    } & User_Key;
  } & Event_Key)[];
}
```
### Using `ListPublicEvents`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listPublicEvents } from '@dataconnect/generated';


// Call the `listPublicEvents()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listPublicEvents();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listPublicEvents(dataConnect);

console.log(data.events);

// Or, you can use the `Promise` API.
listPublicEvents().then((response) => {
  const data = response.data;
  console.log(data.events);
});
```

### Using `ListPublicEvents`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listPublicEventsRef } from '@dataconnect/generated';


// Call the `listPublicEventsRef()` function to get a reference to the query.
const ref = listPublicEventsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listPublicEventsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.events);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.events);
});
```

## GetUserEcoActions
You can execute the `GetUserEcoActions` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUserEcoActions(vars: GetUserEcoActionsVariables): QueryPromise<GetUserEcoActionsData, GetUserEcoActionsVariables>;

interface GetUserEcoActionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserEcoActionsVariables): QueryRef<GetUserEcoActionsData, GetUserEcoActionsVariables>;
}
export const getUserEcoActionsRef: GetUserEcoActionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserEcoActions(dc: DataConnect, vars: GetUserEcoActionsVariables): QueryPromise<GetUserEcoActionsData, GetUserEcoActionsVariables>;

interface GetUserEcoActionsRef {
  ...
  (dc: DataConnect, vars: GetUserEcoActionsVariables): QueryRef<GetUserEcoActionsData, GetUserEcoActionsVariables>;
}
export const getUserEcoActionsRef: GetUserEcoActionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserEcoActionsRef:
```typescript
const name = getUserEcoActionsRef.operationName;
console.log(name);
```

### Variables
The `GetUserEcoActions` query requires an argument of type `GetUserEcoActionsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetUserEcoActionsVariables {
  userId: UUIDString;
}
```
### Return Type
Recall that executing the `GetUserEcoActions` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserEcoActionsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetUserEcoActionsData {
  ecoActions: ({
    id: UUIDString;
    actionType: string;
    createdAt: TimestampString;
    date: DateString;
    description?: string | null;
    pointsImpact?: number | null;
  } & EcoAction_Key)[];
}
```
### Using `GetUserEcoActions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserEcoActions, GetUserEcoActionsVariables } from '@dataconnect/generated';

// The `GetUserEcoActions` query requires an argument of type `GetUserEcoActionsVariables`:
const getUserEcoActionsVars: GetUserEcoActionsVariables = {
  userId: ..., 
};

// Call the `getUserEcoActions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserEcoActions(getUserEcoActionsVars);
// Variables can be defined inline as well.
const { data } = await getUserEcoActions({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserEcoActions(dataConnect, getUserEcoActionsVars);

console.log(data.ecoActions);

// Or, you can use the `Promise` API.
getUserEcoActions(getUserEcoActionsVars).then((response) => {
  const data = response.data;
  console.log(data.ecoActions);
});
```

### Using `GetUserEcoActions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserEcoActionsRef, GetUserEcoActionsVariables } from '@dataconnect/generated';

// The `GetUserEcoActions` query requires an argument of type `GetUserEcoActionsVariables`:
const getUserEcoActionsVars: GetUserEcoActionsVariables = {
  userId: ..., 
};

// Call the `getUserEcoActionsRef()` function to get a reference to the query.
const ref = getUserEcoActionsRef(getUserEcoActionsVars);
// Variables can be defined inline as well.
const ref = getUserEcoActionsRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserEcoActionsRef(dataConnect, getUserEcoActionsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.ecoActions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.ecoActions);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateEcoAction
You can execute the `CreateEcoAction` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createEcoAction(vars: CreateEcoActionVariables): MutationPromise<CreateEcoActionData, CreateEcoActionVariables>;

interface CreateEcoActionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEcoActionVariables): MutationRef<CreateEcoActionData, CreateEcoActionVariables>;
}
export const createEcoActionRef: CreateEcoActionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createEcoAction(dc: DataConnect, vars: CreateEcoActionVariables): MutationPromise<CreateEcoActionData, CreateEcoActionVariables>;

interface CreateEcoActionRef {
  ...
  (dc: DataConnect, vars: CreateEcoActionVariables): MutationRef<CreateEcoActionData, CreateEcoActionVariables>;
}
export const createEcoActionRef: CreateEcoActionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createEcoActionRef:
```typescript
const name = createEcoActionRef.operationName;
console.log(name);
```

### Variables
The `CreateEcoAction` mutation requires an argument of type `CreateEcoActionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateEcoActionVariables {
  userId: UUIDString;
  actionType: string;
  date: DateString;
  description?: string | null;
  pointsImpact: number;
}
```
### Return Type
Recall that executing the `CreateEcoAction` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateEcoActionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateEcoActionData {
  ecoAction_insert: EcoAction_Key;
}
```
### Using `CreateEcoAction`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createEcoAction, CreateEcoActionVariables } from '@dataconnect/generated';

// The `CreateEcoAction` mutation requires an argument of type `CreateEcoActionVariables`:
const createEcoActionVars: CreateEcoActionVariables = {
  userId: ..., 
  actionType: ..., 
  date: ..., 
  description: ..., // optional
  pointsImpact: ..., 
};

// Call the `createEcoAction()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createEcoAction(createEcoActionVars);
// Variables can be defined inline as well.
const { data } = await createEcoAction({ userId: ..., actionType: ..., date: ..., description: ..., pointsImpact: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createEcoAction(dataConnect, createEcoActionVars);

console.log(data.ecoAction_insert);

// Or, you can use the `Promise` API.
createEcoAction(createEcoActionVars).then((response) => {
  const data = response.data;
  console.log(data.ecoAction_insert);
});
```

### Using `CreateEcoAction`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createEcoActionRef, CreateEcoActionVariables } from '@dataconnect/generated';

// The `CreateEcoAction` mutation requires an argument of type `CreateEcoActionVariables`:
const createEcoActionVars: CreateEcoActionVariables = {
  userId: ..., 
  actionType: ..., 
  date: ..., 
  description: ..., // optional
  pointsImpact: ..., 
};

// Call the `createEcoActionRef()` function to get a reference to the mutation.
const ref = createEcoActionRef(createEcoActionVars);
// Variables can be defined inline as well.
const ref = createEcoActionRef({ userId: ..., actionType: ..., date: ..., description: ..., pointsImpact: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createEcoActionRef(dataConnect, createEcoActionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.ecoAction_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.ecoAction_insert);
});
```

## CreateTip
You can execute the `CreateTip` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createTip(vars: CreateTipVariables): MutationPromise<CreateTipData, CreateTipVariables>;

interface CreateTipRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateTipVariables): MutationRef<CreateTipData, CreateTipVariables>;
}
export const createTipRef: CreateTipRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createTip(dc: DataConnect, vars: CreateTipVariables): MutationPromise<CreateTipData, CreateTipVariables>;

interface CreateTipRef {
  ...
  (dc: DataConnect, vars: CreateTipVariables): MutationRef<CreateTipData, CreateTipVariables>;
}
export const createTipRef: CreateTipRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createTipRef:
```typescript
const name = createTipRef.operationName;
console.log(name);
```

### Variables
The `CreateTip` mutation requires an argument of type `CreateTipVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateTipVariables {
  userId: UUIDString;
  content: string;
  title: string;
  category?: string | null;
  imageUrl?: string | null;
}
```
### Return Type
Recall that executing the `CreateTip` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateTipData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateTipData {
  tip_insert: Tip_Key;
}
```
### Using `CreateTip`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createTip, CreateTipVariables } from '@dataconnect/generated';

// The `CreateTip` mutation requires an argument of type `CreateTipVariables`:
const createTipVars: CreateTipVariables = {
  userId: ..., 
  content: ..., 
  title: ..., 
  category: ..., // optional
  imageUrl: ..., // optional
};

// Call the `createTip()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createTip(createTipVars);
// Variables can be defined inline as well.
const { data } = await createTip({ userId: ..., content: ..., title: ..., category: ..., imageUrl: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createTip(dataConnect, createTipVars);

console.log(data.tip_insert);

// Or, you can use the `Promise` API.
createTip(createTipVars).then((response) => {
  const data = response.data;
  console.log(data.tip_insert);
});
```

### Using `CreateTip`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createTipRef, CreateTipVariables } from '@dataconnect/generated';

// The `CreateTip` mutation requires an argument of type `CreateTipVariables`:
const createTipVars: CreateTipVariables = {
  userId: ..., 
  content: ..., 
  title: ..., 
  category: ..., // optional
  imageUrl: ..., // optional
};

// Call the `createTipRef()` function to get a reference to the mutation.
const ref = createTipRef(createTipVars);
// Variables can be defined inline as well.
const ref = createTipRef({ userId: ..., content: ..., title: ..., category: ..., imageUrl: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createTipRef(dataConnect, createTipVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.tip_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.tip_insert);
});
```

