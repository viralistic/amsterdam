export const promisify = f => (...a) => new Promise((res, rej) => f(...a, (e, v) => (e ? rej(e) : res(v))));
export default { promisify };
