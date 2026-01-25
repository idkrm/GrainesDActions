import { CreateEcoActionData, CreateEcoActionVariables, ListPublicEventsData, CreateTipData, CreateTipVariables, GetUserEcoActionsData, GetUserEcoActionsVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateEcoAction(options?: useDataConnectMutationOptions<CreateEcoActionData, FirebaseError, CreateEcoActionVariables>): UseDataConnectMutationResult<CreateEcoActionData, CreateEcoActionVariables>;
export function useCreateEcoAction(dc: DataConnect, options?: useDataConnectMutationOptions<CreateEcoActionData, FirebaseError, CreateEcoActionVariables>): UseDataConnectMutationResult<CreateEcoActionData, CreateEcoActionVariables>;

export function useListPublicEvents(options?: useDataConnectQueryOptions<ListPublicEventsData>): UseDataConnectQueryResult<ListPublicEventsData, undefined>;
export function useListPublicEvents(dc: DataConnect, options?: useDataConnectQueryOptions<ListPublicEventsData>): UseDataConnectQueryResult<ListPublicEventsData, undefined>;

export function useCreateTip(options?: useDataConnectMutationOptions<CreateTipData, FirebaseError, CreateTipVariables>): UseDataConnectMutationResult<CreateTipData, CreateTipVariables>;
export function useCreateTip(dc: DataConnect, options?: useDataConnectMutationOptions<CreateTipData, FirebaseError, CreateTipVariables>): UseDataConnectMutationResult<CreateTipData, CreateTipVariables>;

export function useGetUserEcoActions(vars: GetUserEcoActionsVariables, options?: useDataConnectQueryOptions<GetUserEcoActionsData>): UseDataConnectQueryResult<GetUserEcoActionsData, GetUserEcoActionsVariables>;
export function useGetUserEcoActions(dc: DataConnect, vars: GetUserEcoActionsVariables, options?: useDataConnectQueryOptions<GetUserEcoActionsData>): UseDataConnectQueryResult<GetUserEcoActionsData, GetUserEcoActionsVariables>;
