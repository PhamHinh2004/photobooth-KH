const configuredApiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
const configuredUrl = configuredApiUrl
  ? new URL(configuredApiUrl, window.location.origin)
  : null;
const usesLocalApi = !configuredUrl || ['localhost', '127.0.0.1', '::1'].includes(configuredUrl.hostname);

export const API_BASE_URL = usesLocalApi ? '/api/v1' : configuredUrl!.toString().replace(/\/$/, '');
export const API_SOCKET_ORIGIN = usesLocalApi ? window.location.origin : configuredUrl!.origin;