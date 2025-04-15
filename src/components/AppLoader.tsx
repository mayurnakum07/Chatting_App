import { IonContent, IonPage, IonSpinner } from "@ionic/react";

const AppLoader = () => {
  return (
    <IonPage>
      <IonContent>
        <div
          style={{
            width: "100%",
            height: "100vh",
            background: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <IonSpinner />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AppLoader;
