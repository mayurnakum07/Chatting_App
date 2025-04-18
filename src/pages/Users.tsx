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
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
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

  const openChat = async (otherUserId: string) => {
    const chatRoomsRef = collection(db, "chat_rooms");
    const q = query(
      chatRoomsRef,
      where("chatType", "==", "1v1"),
      where("participants", "array-contains", user?.uid)
    );

    const querySnapshot = await getDocs(q);

    let existingRoom: any = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(otherUserId)) {
        existingRoom = { id: doc.id, ...data };
      }
    });

    let roomId = existingRoom?.id;

    if (!roomId) {
      const newRoomRef = doc(chatRoomsRef);
      roomId = newRoomRef.id;

      await setDoc(newRoomRef, {
        chatType: "1v1",
        createdAt: serverTimestamp(),
        participants: [user?.uid, otherUserId],
        joiningData: [
          {
            user: user?.uid,
            joinedAt: Date.now(),
          },
          {
            user: otherUserId,
            joinedAt: Date.now(),
          },
        ],
      });
    }

    history.push(`/chat/${roomId}?other=${otherUserId}`);
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
              <IonLabel>{u.firstName}</IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Users;
