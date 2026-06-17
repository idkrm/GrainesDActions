const PROJECT_ID = 'graines-d-actions-but3';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

import { getAuth } from 'firebase/auth';
import { getIdToken } from "./auth";


const getToken = async () => {
    const user = getAuth().currentUser;
    return await user.getIdToken();
}

function decodeValue(value) {
  const type = Object.keys(value)[0];
  const v = value[type];
  if (type === "integerValue") return parseInt(v, 10);
  if (type === "doubleValue") return Number(v);
  if (type === "booleanValue") return Boolean(v);
  if (type === "nullValue") return null;
  if (type === "timestampValue") return new Date(v);
  if (type === "mapValue") return decodeFields(v.fields);
  if (type === "arrayValue") return (v.values || []).map(decodeValue);
  return v; 
}

function decodeFields(fields = {}) {
  const out = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = decodeValue(value);
  }
  return out;
}

function formatValue(val) {
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (val === null || val === undefined) return { nullValue: null };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(formatValue) } };
  if (typeof val === 'object') return { mapValue: { fields: formatFields(val) } };
  return { stringValue: String(val) };
}

function formatFields(obj = {}) {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    result[key] = formatValue(val);
  }
  return result;
}

export const getDoc = async (collection, docId) => {
  console.log('Requête envoyée vers :', `${BASE_URL}/${collection}/${docId}`);
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/${collection}/${docId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore REST ${res.status}`);
  const json = await res.json();
  console.log('Réponse reçue :', json);
  console.log('Status :', res.status);
  return { id: docId, ...decodeFields(json.fields) };
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
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: formatFields(data) }),  
  });
  return await res.json();
};

export const postDoc = async (collection, data) => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/${collection}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: formatFields(data) }),
  });
  return await res.json();
};

export const deleteDoc = async (collection, docId) => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/${collection}/${docId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.ok;
};