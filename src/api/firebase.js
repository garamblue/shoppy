import { initializeApp } from 'firebase/app';
import { v4 as uuid } from 'uuid';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { getDatabase, ref, set, get, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DB_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const provider = new GoogleAuthProvider();
const database = getDatabase(app);

// login 을 여기에 넣은 이유: navbar 등에서 바로 사용하기 위해
// navbar 에 넣으면 navbar 가 firebase 에 너무 의존하게 됨
// firebase 관련 코드는 api/firebase.js 에서 관리하는 게 좋음.
// export async function login() {
//   return signInWithPopup(auth, provider)
//     .then((result) => {
//       const user = result.user;
//       console.log('login user: ', user);
//       return user;
//     })
//     .catch(console.error);
// }
export function login() {
  signInWithPopup(auth, provider).catch(console.error);
}

export function logout() {
  signOut(auth).catch(console.error);
}

export function onUserStateChange(callback) {
  onAuthStateChanged(auth, async (user) => {
    //1. 사용자가 있는 경우(로그인한 경우)
    user && adminUser(user);
    //2. 사용자가 어드민 권한을 가지고 있는지
    //3. {...user, isAdmin: true/false}
    const updatedUser = user ? await adminUser(user) : null;
    console.log('updatedUser: ', updatedUser);
    callback(updatedUser);
  });
}

async function adminUser(user) {
  return get(ref(database, 'admins'))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const admins = snapshot.val();
        const isAdmin = admins.includes(user.uid);
        return { ...user, isAdmin };
      }
      return user;
    });
}

export async function addNewProduct(product, image) {
  const id = uuid();
  return set(ref(database, `products/${id}`), {
    ...product,
    id,
    price: parseInt(product.price),
    image,
    options: product.options.split(','),
  });
}

export async function getProducts() {
  return get(ref(database, 'products')).then((snapshot) => {
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return [];
  });
}

export async function getCart(userId) {
  return get(ref(database, `carts/${userId}`)) //
    .then((snapshot) => {
      const items = snapshot.val() || {};
      return Object.values(items);
    });
}

export async function addOrUpdateToCart(userId, product) {
  return set(ref(database, `carts/${userId}/${product.id}`), product);
}

export async function removeFromCart(userId, productId) {
  return remove(ref(database, `carts/${userId}/${productId}`));
}
