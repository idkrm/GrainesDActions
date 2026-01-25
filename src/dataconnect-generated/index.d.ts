import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Comment_Key {
  id: UUIDString;
  __typename?: 'Comment_Key';
}

export interface CreateEcoActionData {
  ecoAction_insert: EcoAction_Key;
}

export interface CreateEcoActionVariables {
  userId: UUIDString;
  actionType: string;
  date: DateString;
  description?: string | null;
  pointsImpact: number;
}

export interface CreateTipData {
  tip_insert: Tip_Key;
}

export interface CreateTipVariables {
  userId: UUIDString;
  content: string;
  title: string;
  category?: string | null;
  imageUrl?: string | null;
}

export interface EcoAction_Key {
  id: UUIDString;
  __typename?: 'EcoAction_Key';
}

export interface Event_Key {
  id: UUIDString;
  __typename?: 'Event_Key';
}

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

export interface GetUserEcoActionsVariables {
  userId: UUIDString;
}

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

export interface Tip_Key {
  id: UUIDString;
  __typename?: 'Tip_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateEcoActionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEcoActionVariables): MutationRef<CreateEcoActionData, CreateEcoActionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateEcoActionVariables): MutationRef<CreateEcoActionData, CreateEcoActionVariables>;
  operationName: string;
}
export const createEcoActionRef: CreateEcoActionRef;

export function createEcoAction(vars: CreateEcoActionVariables): MutationPromise<CreateEcoActionData, CreateEcoActionVariables>;
export function createEcoAction(dc: DataConnect, vars: CreateEcoActionVariables): MutationPromise<CreateEcoActionData, CreateEcoActionVariables>;

interface ListPublicEventsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPublicEventsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPublicEventsData, undefined>;
  operationName: string;
}
export const listPublicEventsRef: ListPublicEventsRef;

export function listPublicEvents(): QueryPromise<ListPublicEventsData, undefined>;
export function listPublicEvents(dc: DataConnect): QueryPromise<ListPublicEventsData, undefined>;

interface CreateTipRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateTipVariables): MutationRef<CreateTipData, CreateTipVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateTipVariables): MutationRef<CreateTipData, CreateTipVariables>;
  operationName: string;
}
export const createTipRef: CreateTipRef;

export function createTip(vars: CreateTipVariables): MutationPromise<CreateTipData, CreateTipVariables>;
export function createTip(dc: DataConnect, vars: CreateTipVariables): MutationPromise<CreateTipData, CreateTipVariables>;

interface GetUserEcoActionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserEcoActionsVariables): QueryRef<GetUserEcoActionsData, GetUserEcoActionsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetUserEcoActionsVariables): QueryRef<GetUserEcoActionsData, GetUserEcoActionsVariables>;
  operationName: string;
}
export const getUserEcoActionsRef: GetUserEcoActionsRef;

export function getUserEcoActions(vars: GetUserEcoActionsVariables): QueryPromise<GetUserEcoActionsData, GetUserEcoActionsVariables>;
export function getUserEcoActions(dc: DataConnect, vars: GetUserEcoActionsVariables): QueryPromise<GetUserEcoActionsData, GetUserEcoActionsVariables>;

