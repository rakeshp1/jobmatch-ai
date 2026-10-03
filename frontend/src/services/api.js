import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:43124/api';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export function errorMessage(error) {
  const data = error?.response?.data;
  if (Array.isArray(data?.details) && data.details.length) return data.details.join(' ');
  if (data?.error) return data.error;
  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return 'Cannot reach the API. Start the backend on port 43124 and refresh.';
  }
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Try again.';
  return 'Something went wrong. Try again.';
}

export const ResumeApi = {
  get: () => api.get('/resume').then((response) => response.data),
  upload: (file) => {
    const form = new FormData();
    form.append('resume', file);
    return api.post('/resume', form).then((response) => response.data);
  },
  useSample: () => api.post('/resume/sample').then((response) => response.data),
  remove: () => api.delete('/resume').then((response) => response.data),
  resetTailoring: () => api.post('/resume/reset-tailoring').then((response) => response.data),
  samplePdfUrl: `${API_BASE}/resume/sample.pdf`,
};

export const JobsApi = {
  list: () => api.get('/jobs').then((response) => response.data),
  get: (id) => api.get(`/jobs/${id}`).then((response) => response.data),
  create: (body) => api.post('/jobs', body).then((response) => response.data),
  update: (id, body) => api.put(`/jobs/${id}`, body).then((response) => response.data),
  remove: (id) => api.delete(`/jobs/${id}`).then((response) => response.data),
  loadSamples: () => api.post('/jobs/samples').then((response) => response.data),
  analyze: (id) => api.post(`/jobs/${id}/analyze`).then((response) => response.data),
  analyzeAll: () => api.post('/jobs/analyze-all').then((response) => response.data),
  improve: (id) => api.get(`/jobs/${id}/improve`).then((response) => response.data),
  accept: (id, recommendationIds) => api.post(`/jobs/${id}/improve/accept`, { recommendationIds }).then((response) => response.data),
  setStatus: (id, status) => api.patch(`/jobs/${id}/status`, { status }).then((response) => response.data),
};

export const DashboardApi = {
  get: () => api.get('/dashboard').then((response) => response.data),
};
