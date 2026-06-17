import { getAuth } from 'firebase/auth';

export const getIdToken = async () => {
  return new Promise((resolve, reject) => {
    const auth = getAuth();
    if (auth.currentUser) {
      return auth.currentUser.getIdToken().then(resolve).catch(reject);
    }
      const unsubcribe = auth.onAuthStateChanged(async (user) => {
        unsubcribe();
              if (user) {
        try {
          const token = await user.getIdToken();
          resolve(token);
        } catch (err) {
          reject(err);
        }
      } else {
        reject(new Error('Non connecté'));
      }
    })
  })
  
};