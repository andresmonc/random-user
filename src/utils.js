import mersenne from 'mersenne';

export function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

export function random(mode, length) {
  let result = '';
  let chars;

  if (mode == 1) {
    chars = 'abcdef1234567890';
  } else if (mode == 2) {
    chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
  } else if (mode == 3) {
    chars = '0123456789';
  } else if (mode == 4) {
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  } else if (mode == 5) {
    chars = '23456789';
  } else if (mode == 6) {
    chars = 'abcdefghijklmnopqrstuvwxyz';
  }
  for (let i = 0; i < length; i++) {
    result += chars[range(0, chars.length-1)];
  }

  return result;
}

export function randomItem(arr) {
  return arr[range(0, arr.length-1)];
}

export function range(min, max) {
  return min + mersenne.rand(max-min+1);
}

export function uppercaseify(val) {
  if (Array.isArray(val)) {
    return val.map(str => {
      return str.toUpperCase();
    });
  } else {
    return val.toUpperCase();
  }
}

export function include(inc, contents, field, value) {
  if (inc.indexOf(field) !== -1) {
    if (typeof value === 'function') value();
    else contents[field] = value;
  }
}
