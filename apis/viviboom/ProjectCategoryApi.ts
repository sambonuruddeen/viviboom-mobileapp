import axios, { AxiosResponse } from 'axios';

import Config from '../../constants/Config';

async function getList({ authToken, ...params }) {
  return axios.get<{ projectCategories: Array<ProjectCategory> }>(`${Config.ApiBaseUrl}/v2/project-category`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

async function post({ authToken, name, ...rest }) {
  return axios.post<never, AxiosResponse<{ projectCategoryId: number }>>(
    `${Config.ApiBaseUrl}/v2/project-category`,
    {
      name,
      ...rest,
    },
    {
      headers: { 'auth-token': authToken },
    },
  );
}

export default {
  getList,
  post,
};
