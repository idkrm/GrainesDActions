const PROJECT_ID = 'graines-d-actions-but3';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

import { getAuth } from 'firebase/auth';
import { getIdToken } from "./auth";


const getToken = async () => {
    const user = getAuth().currentUser;
    return await user.getIdToken();
}

export const getDoc = async (collection, docId) => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/${collection}/${docId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
};

export const getCollection = async (collection) => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/${collection}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
};

export const updateDoc = async (collection, docId, data) => {
  const token = await getToken();
  const fields = Object.keys(data).map(d => `updateMask.fieldPaths=${d}`).join('&');
  const res = await fetch(`${BASE_URL}/${collection}/${docId}?${fields}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: formatFields(data) }),
  });
  return await res.json();
};

export const postDoc = async (collection, data) => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/${collection}`, {
    method: 'POST',
    headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({fields: formatFields(data)}),
  });
  return await res.json();
};

export const deleteDoc = async (collection, docId) => {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}/${collection}/${docId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        },
    });
    return await res.ok;
}

const formatFields = (obj) => {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') result[key] = { stringValue: val };
    else if (typeof val === 'number') result[key] = { integerValue: val };
    else if (typeof val === 'boolean') result[key] = { booleanValue: val };
    else if (Array.isArray(val)) {
      result[key] = {
        arrayValue: {
          values: val.map(v => ({ stringValue: v }))
        }
      };
    }
  }
  return result;
};

