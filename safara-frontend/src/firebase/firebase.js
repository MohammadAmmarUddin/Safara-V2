import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_SAFARA_apiKey,
  authDomain: import.meta.env.VITE_SAFARA_authDomain,
  projectId: import.meta.env.VITE_SAFARA_projectId,
  storageBucket: import.meta.env.VITE_SAFARA_storageBucket,
  messagingSenderId: import.meta.env.VITE_SAFARA_messagingSenderId,
  appId: import.meta.env.VITE_SAFARA_appId,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;
