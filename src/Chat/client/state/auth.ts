import cons from './cons';

const isAuthenticated = () => localStorage.getItem(cons.secretKey.ACCESS_TOKEN) !== null;

const getSecret = () => ({
  accessToken: 'accesstoken',
  deviceId: 'deviceid',
  userId: 'userid',
  baseUrl: 'baseurl',
});

export { isAuthenticated, getSecret };
