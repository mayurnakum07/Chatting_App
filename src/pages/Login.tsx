import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonLabel,
  IonToast,
} from "@ionic/react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuthStore } from "../store/authStore";
import { useHistory } from "react-router-dom";
import { auth } from "../helper/fb";
import { handleGoogleLogin } from "../functions";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const setUser = useAuthStore((state) => state.setUser);
  const history = useHistory();

  const handleLogin = async () => {
    try {
      const userCredential: any = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      history.replace("/home");
    } catch (error: any) {
      console.log("error: ", error);
      setToastMessage(error.message);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="floating">Email</IonLabel>
          <IonInput
            type="email"
            value={email}
            onIonChange={(e) => setEmail(e.detail.value!)}
          />
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Password</IonLabel>
          <IonInput
            type="password"
            value={password}
            onIonChange={(e) => setPassword(e.detail.value!)}
          />
        </IonItem>
        <IonButton
          expand="block"
          onClick={handleLogin}
          className="ion-margin-top"
        >
          Login
        </IonButton>
        <IonButton
          expand="block"
          onClick={() => history.push("/register")}
          className="ion-margin-top"
        >
          Register
        </IonButton>
        <IonButton
          expand="block"
          onClick={async () => {
            await handleGoogleLogin();
            history.replace("/home");
          }}
          className="ion-margin-top"
        >
          Google
        </IonButton>

        <IonToast
          isOpen={!!toastMessage}
          onDidDismiss={() => setToastMessage("")}
          message={toastMessage}
          duration={2000}
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
