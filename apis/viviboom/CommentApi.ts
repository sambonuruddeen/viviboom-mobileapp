import axios from 'axios';

import Config from '../../constants/Config';

async function deleteComment({ authToken, commentId }) {
  return axios.delete(`${Config.ApiBaseUrl}/v2/comment/${commentId}`, {
    headers: { 'auth-token': authToken },
  });
}

async function get({ authToken, commentId, ...params }) {
  return axios.get<ProjectComment>(`${Config.ApiBaseUrl}/v2/comment/${commentId}`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

async function getList({ authToken, ...params }) {
  return axios.get<{ comments: ProjectComment[]; count: number }>(`${Config.ApiBaseUrl}/v2/comment`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

async function like({ authToken, commentId, isLike, ...rest }) {
  return axios.post<{ isLike: boolean }>(
    `${Config.ApiBaseUrl}/v2/comment/like`,
    {
      commentId,
      isLike,
      ...rest,
    },
    {
      headers: { 'auth-token': authToken },
    },
  );
}

async function patch({ authToken, commentId, text, isFlagged, ...rest }) {
  return axios.patch(
    `${Config.ApiBaseUrl}/v2/comment/${commentId}`,
    {
      text,
      isFlagged,
      ...rest,
    },
    {
      headers: { 'auth-token': authToken },
    },
  );
}

async function post({ authToken, projectId, text, parentCommentId, ...rest }) {
  return axios.post(
    `${Config.ApiBaseUrl}/v2/comment`,
    {
      projectId,
      parentCommentId,
      text,
      ...rest,
    },
    {
      headers: { 'auth-token': authToken },
    },
  );
}

export default {
  deleteComment,
  get,
  getList,
  like,
  patch,
  post,
};
