import { NgModule } from '@angular/core';
import { APOLLO_OPTIONS } from 'apollo-angular';
// import { ApolloClient } from '@apollo/client';
import {
  ApolloClientOptions,
  InMemoryCache,
} from '@apollo/client/core';
import { HttpLink } from 'apollo-angular/http';
// import { setContext } from '@apollo/client/link/context';
import { split } from '@apollo/client/core';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';

const uri = 'http://localhost:4000/graphql'; // <-- add the URL of the GraphQL server here
const wsuri = 'ws://localhost:4000/graphql';

export function createApollo(httpLink: HttpLink): ApolloClientOptions<any> {
  const http = httpLink.create({
    uri: 'http://localhost:4000/graphql',
  });
  const ws = new WebSocketLink({
    uri: 'ws://localhost:4000/graphql',
    options: {
      reconnect: true,
    },
  });
  const cache = new InMemoryCache({addTypename: false});
  const link = split(
    ({ query }) => {
      const data = getMainDefinition(query);
      return (
        data.kind === 'OperationDefinition' && data.operation === 'subscription'
      );
    },
    ws,
    http,
  );

  return {
    link,
    cache,
  };
}
@NgModule({
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink],
    },
  ],
})
export class GraphQLModule {}