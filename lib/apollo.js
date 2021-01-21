import { useMemo } from 'react';
import {
  createHttpLink,
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  split,
} from "@apollo/client";
import { onError } from "apollo-link-error";
import { setContext } from '@apollo/client/link/context';
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";

let apolloClient;

const createApolloClient = (initialState = {}) => {
  const httpLink = createHttpLink({
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
    },
    uri: process.env.GRAPHQL_URL,
  });

  const webSocketLink = process.browser ? new WebSocketLink({
    uri: process.env.GRAPHQL_URL.replace(/^https?/, "wss"),
    options: {
      connectionParams: {
        reconnect: true,
      },
    },
  }) : null;

  const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('token');

    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      }
    }
  });

  const onErrorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors)
      graphQLErrors.forEach(({ message, locations, path }) =>
        console.log(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        )
      );
    if (networkError) console.log(`[Network error]: ${networkError}`);
  });

  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link: authLink.concat(ApolloLink.from([
      (onErrorLink),

      process.browser ? split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === "OperationDefinition" &&
            definition.operation === "subscription"
          );
        },
        (webSocketLink),
        httpLink
      ) : httpLink,
    ])),
    cache: new InMemoryCache().restore(initialState),
  });
}

const initializeApollo = (initialState = null) => {
  const client = apolloClient ?? createApolloClient();

  // If your page has Next.js data fetching methods that use Apollo Client,
  // the initial state gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = client.extract();

    // Restore the cache using the data passed from
    // getStaticProps/getServerSideProps combined with the existing cached data
    client.cache.restore({ ...existingCache, ...initialState });
  }

  // For SSG and SSR always create a new Apollo Client
  if (typeof window === "undefined") return client;

  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = client;
  return client;
}

export function useApollo(initialState = null) {
  const store = useMemo(() => initializeApollo(initialState), [initialState]);
  return store;
}