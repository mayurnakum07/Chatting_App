import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButtons,
} from "@ionic/react";
import { collection, getDocs } from "firebase/firestore";
import { useAuthStore } from "../store/authStore";
import { useHistory } from "react-router";
import { db } from "../helper/fb";

const Users: React.FC = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const history = useHistory();

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList.filter((u) => u.id !== user?.uid));
    };
    fetchUsers();
  }, []);

  const openChat = (otherUserId: string) => {
    const chatId = [user?.uid, otherUserId].sort().join("_");
    history.push(`/chat/${chatId}?other=${otherUserId}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
           <IonButtons onClick={() => history.goBack()}>Back</IonButtons>
          <IonTitle>Select User</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          {users.map((u) => (
            <IonItem button key={u.id} onClick={() => openChat(u.id)}>
              <IonLabel>{u.name}</IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Users;
