import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import {
  StocksAppConfig,
  StocksAppConfigToken
} from '@coding-challenge/stocks/data-access-app-config';
import { Effect } from '@ngrx/effects';
import { DataPersistence } from '@nrwl/nx';
import { filter, map } from 'rxjs/operators';
import moment from 'moment';

import {
  FetchPriceQuery,
  PriceQueryActionTypes,
  PriceQueryFetched,
  PriceQueryFetchError
} from './price-query.actions';
import { PriceQueryPartialState } from './price-query.reducer';
import { PriceQueryResponse } from './price-query.type';

@Injectable()
export class PriceQueryEffects {
  @Effect() loadPriceQuery$ = this.dataPersistence.fetch(
    PriceQueryActionTypes.FetchPriceQuery,
    {
      run: (action: FetchPriceQuery, state: PriceQueryPartialState) => {
        const fromDate = moment(action.period.from);
        const toDate = moment(action.period.to);

        return this.httpClient
          .get(
            `${this.env.apiURL}/beta/stock/${action.symbol}/chart/max?token=${this.env.apiKey}`
          )
          .pipe(
            map((resp) => {
              /*
                IEX doesn't support date ranges on historical data so we'll retrieve the
                max data set and filter to the 'from' and 'to' values client side.
              */
              const queryResponse = new PriceQueryFetched(resp as PriceQueryResponse[]);
              queryResponse.queryResults = queryResponse.queryResults.filter((result: PriceQueryResponse) => {
                return moment(result.date).isBetween(fromDate, toDate, null, '[]');
              });
              return queryResponse;
            })
          );
      },

      onError: (action: FetchPriceQuery, error) => {
        return new PriceQueryFetchError(error);
      }
    }
  );

  constructor(
    @Inject(StocksAppConfigToken) private env: StocksAppConfig,
    private httpClient: HttpClient,
    private dataPersistence: DataPersistence<PriceQueryPartialState>
  ) {}
}
