import { getAuth } from 'firebase/auth';

export const getIdToken = async () => {
  const user = getAuth().currentUser;
  if (!user) throw new Error('Non connecté');
  return await user.getIdToken(); 
};