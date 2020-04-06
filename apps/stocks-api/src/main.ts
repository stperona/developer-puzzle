/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 **/
import { Server } from 'hapi';
import * as Wreck from '@hapi/wreck';
import * as CatboxMemory from '@hapi/catbox-memory';
import { environment } from './environments/environment';


const init = async () => {
  const server = new Server({
    port: 3333,
    host: 'localhost',
    cache: [
      {
        name: 'stocks_cache',
        provider: {
            constructor: CatboxMemory,
            options: {
                partition : 'stocks_cached_data'
            }
        }
      }
    ]
  });

  const stocksCache = server.cache({
    cache: 'stocks_cache',
    segment: 'stocks',
    expiresIn: 1000 * 50,
    generateFunc: async (data: any) => {
      const { res, payload } = await Wreck.get(`${environment.apiURL}/beta/stock/${data.symbol}/chart/${data.period}?token=${data.token}`, { json: 'force' });
      return payload;
    },
    generateTimeout: 2000
	});

  server.route({
    method: 'GET',
    path: '/api/stock/{symbol}/chart/{period}',
    handler: async (request, h) => {
      const key = {
         segment: 'stocks',
         id: request.params.symbol + '_' + request.params.period,
         symbol: request.params.symbol,
         period: request.params.period,
         token: request.query.token
       };

       return await stocksCache.get(key);
    }
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', err => {
  console.log(err);
  process.exit(1);
});

init();
