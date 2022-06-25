import { Injectable } from '@angular/core';
import { QueryMutationService } from './query-mutation.service';
import { gql } from 'apollo-angular';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(
    private _qmService : QueryMutationService
  ) { }



  async getInterfaces(): Promise<string[]>{
    let query = gql`
      query{
        getInterfaces
      }
    `;

    return await this._qmService.Query(query);
  }

  async ping(): Promise<boolean>{
    let query = gql`
      query{
        ping
      }
    `;

    return await this._qmService.Query(query);
  }
}
