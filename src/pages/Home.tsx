import {
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonPage,
  IonRow,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { signOut } from "firebase/auth";
import { auth } from "../helper/fb";
import { useAuthStore } from "../store/authStore";
import { useHistory } from "react-router";

const Home = () => {
  const history = useHistory();

  const logout = async () => {
    await signOut(auth);
    useAuthStore.getState().setUser(null);
    history.replace("/login");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Home</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid class="ion-no-padding chat-grid">
          <IonRow>
            <IonCol
              sizeXl={"6"}
              offsetXl={"3"}
              sizeLg={"6"}
              offsetLg={"3"}
              sizeMd={"8"}
              offsetMd={"2"}
              sizeXs={"12"}
              className="ion-no-padding"
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <IonButton onClick={logout}>logout</IonButton>
                <IonButton onClick={() => history.push("/users")}>
                  Start Chatting
                </IonButton>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Home;
