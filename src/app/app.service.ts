import { Injectable } from '@angular/core';
import { QueryMutationService } from './query-mutation.service';
import { Apollo, gql } from 'apollo-angular';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  _notification:Subject<ResultI>;

  constructor(
    private _qmService: QueryMutationService,
    private apollo: Apollo,
  ) { 
    this._notification = new Subject(); 
  }



  async getInterfaces(): Promise<string[]> {
    let query = gql`
      query{
        getInterfaces
      }
    `;

    return await this._qmService.Query(query);
  }

  async ping(): Promise<boolean> {
    let query = gql`
      query{
        ping
      }
    `;
    return await this._qmService.Query(query);
  }


  async startListening(port: number, _interface: string) {
    return this.apollo.subscribe({
      query: gql`
          subscription($port: Int, $interface: String) {
            startDetection(port: $port, interface: $interface) {
                  src
                  payload
                  attack
              }
          }    
      `,
      fetchPolicy: 'no-cache',
      variables : {port, interface: _interface}
    }).subscribe((res: any) => {
      this._notification.next(res.data.startDetection);
    })
  }
}


export interface ResultI{
  src: string, 
  payload: string, 
  attack : boolean,
}