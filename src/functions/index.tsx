import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../helper/fb";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";

const handleGoogleLogin = async () => {
  try {
    const result = await FirebaseAuthentication.signInWithGoogle();

    const credential = GoogleAuthProvider.credential(
      result?.credential?.idToken
    );
    const { user } = await signInWithCredential(auth, credential);

    if (user) {
      const userDocRef = doc(db, "users", user.uid);

      const isNewUser =
        result?.additionalUserInfo?.isNewUser ||
        user?.metadata?.creationTime === user?.metadata?.lastSignInTime;

      if (isNewUser) {
        const userData = {
          uid: user.uid,
          email: user.email,
          photoURL: user.photoURL || "",
          loginMethod: "google.com",
          firstName: user.displayName ? user.displayName.split(" ")[0] : "",
          lastName: user.displayName
            ? user.displayName.split(" ")[1] || ""
            : "",
          createdAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, userData);
      }
    }
  } catch (error) {
    console.error("Google sign-in error:", error);
  }
};

export { handleGoogleLogin };
