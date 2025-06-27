import { inject } from 'regexparam';

import type { GetEpisodeListRequestQuery } from '@wsh-2024/schema/src/api/episodes/GetEpisodeListRequestQuery';
import type { GetEpisodeListResponse } from '@wsh-2024/schema/src/api/episodes/GetEpisodeListResponse';
import type { GetEpisodeRequestParams } from '@wsh-2024/schema/src/api/episodes/GetEpisodeRequestParams';
import type { GetEpisodeResponse } from '@wsh-2024/schema/src/api/episodes/GetEpisodeResponse';

import type { DomainSpecificApiClientInterface } from '../../../lib/api/DomainSpecificApiClientInterface';
import { apiClient } from '../../../lib/api/apiClient';
import { performanceLogger } from '../../../lib/performance';

type EpisodeApiClient = DomainSpecificApiClientInterface<{
  fetch: [{ params: GetEpisodeRequestParams }, GetEpisodeResponse];
  fetchList: [{ query: GetEpisodeListRequestQuery }, GetEpisodeListResponse];
}>;

export const episodeApiClient: EpisodeApiClient = {
  fetch: async ({ params }) => {
    return performanceLogger.measureAsync(
      `API-episode-fetch-${params.episodeId}`,
      async () => {
        const response = await apiClient.get<GetEpisodeResponse>(inject('/api/v1/episodes/:episodeId', params));
        return response.data;
      },
      { episodeId: params.episodeId }
    );
  },
  fetch$$key: (options) => ({
    requestUrl: `/api/v1/episodes/:episodeId`,
    ...options,
  }),
  fetchList: async ({ query }) => {
    return performanceLogger.measureAsync(
      'API-episode-fetchList',
      async () => {
        const response = await apiClient.get<GetEpisodeListResponse>(inject('/api/v1/episodes', {}), {
          params: query,
        });
        return response.data;
      },
      { query }
    );
  },
  fetchList$$key: (options) => ({
    requestUrl: `/api/v1/episodes`,
    ...options,
  }),
};
