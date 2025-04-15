import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonFooter,
  IonButtons,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
} from "@ionic/react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  addDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useHistory } from "react-router";
import { useAuthStore } from "../store/authStore";
import { Pencil, Trash2 } from "lucide-react";
import { db } from "../helper/fb";
import "../theme/chat.css";

const Chat: React.FC = () => {
  const history = useHistory();
  const { chatId } = useParams<{ chatId: string }>();
  const searchParams = new URLSearchParams(useLocation().search);
  const otherUserId = searchParams.get("other");
  const { user } = useAuthStore();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const contentRef = useRef<any>(null);
  const textareaRef: any = useRef(null);
  const [showOptions, setShowOptions] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId || !user?.uid || !otherUserId) return;

    const ensureChatExists = async () => {
      const chatRef = doc(db, "chats", chatId);
      await setDoc(
        chatRef,
        { users: [user.uid, otherUserId] },
        { merge: true }
      );
    };

    ensureChatExists();

    const msgsRef = collection(db, "chats", chatId, "messages");
    const q = query(msgsRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [chatId, user, otherUserId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      contentRef.current?.scrollToBottom(300);
    }, 100);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const msgsRef = collection(db, "chats", chatId, "messages");

    if (editingMessageId) {
      const msgDoc = doc(msgsRef, editingMessageId);
      await updateDoc(msgDoc, {
        text: message.trim(),
        isEdited: true,
      });
      setEditingMessageId(null);
    } else {
      await addDoc(msgsRef, {
        text: message.trim(),
        senderId: user?.uid,
        timestamp: serverTimestamp(),
      });
    }

    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const SkeletonMessageLoader = () => (
    <div className="skeleton-message">
      <div className="skeleton-user-image" />
      <div className="skeleton-content">
        <div className="skeleton-chat" />
        <div className="skeleton-time" />
      </div>
    </div>
  );

  const handleInputChange = (e: any) => {
    setMessage(e.target.value);
    autoGrowTextArea();
  };

  const autoGrowTextArea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        64
      )}px`;
    }
  };

  const editMessageHandler = (msg: any) => {
    setMessage(msg.text);
    setEditingMessageId(msg.id);
    autoGrowTextArea();
  };

  const handleDeleteMessage = async (msgId: string) => {
    const msgRef = doc(db, "chats", chatId, "messages", msgId);
    await deleteDoc(msgRef);
  };

  const cleanupOldMessages = async () => {
    const oneHour = 60 * 60 * 1000;
    const now = Date.now();

    const msgsRef = collection(db, "chats", chatId, "messages");
    const querySnapshot = await getDocs(msgsRef);

    const batch = writeBatch(db);

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const timestamp = data.timestamp?.seconds
        ? data.timestamp.seconds * 1000
        : 0;

      if (now - timestamp > oneHour) {
        batch.delete(docSnap.ref);
      }
    });

    await batch.commit();
  };

  useEffect(() => {
    if (chatId) {
      cleanupOldMessages();
      console.log("Cleaning up old messages");
    }
  }, [chatId]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="chat-toolbar">
          <IonButtons onClick={() => history.goBack()}>Back</IonButtons>
          <IonTitle>Private Chat</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent ref={contentRef} className="ion-padding">
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
              {!messages?.length
                ? Array.from({ length: 5 }).map((_, index) => (
                    <SkeletonMessageLoader key={index} />
                  ))
                : messages.map((item, index) => (
                    <div
                      key={item.id}
                      className={`${
                        item?.senderId === user?.uid
                          ? "right-chat"
                          : "left-chat"
                      } chat-message`}
                    >
                      <div className="chat-container">
                        <div className="c-content-chat">
                          <div className="chat-inner-container">
                            <div className="customChatBox">
                              <div
                                className="chat-box-right-chat body-regular-14 natural-01"
                                onClick={() =>
                                  item?.senderId === user?.uid &&
                                  setShowOptions(
                                    showOptions === index ? null : index
                                  )
                                }
                              >
                                {item?.text}
                              </div>
                              <div className="time">
                                {item?.isEdited && (
                                  <span className="body-regular-12 natural-03">
                                    Edited &nbsp;
                                  </span>
                                )}
                                {item?.timestamp?.seconds
                                  ? new Date(
                                      item.timestamp.seconds * 1000
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </div>
                            </div>
                          </div>
                          <div className="message-options">
                            {showOptions === index && (
                              <div className="action-option">
                                <div
                                  className="options-popup"
                                  onClick={() => handleDeleteMessage(item.id)}
                                >
                                  <Trash2 className="delete-icon" />
                                </div>
                                <div
                                  className="edit-popup"
                                  onClick={() => editMessageHandler(item)}
                                >
                                  <Pencil className="edit-icon" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>

      <IonFooter>
        <IonToolbar className="c-toolbar-footer-chat">
          <IonGrid>
            <IonRow>
              <IonCol>
                <div className="chat-input">
                  <div className="inner-chat">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      className="message-input"
                      value={message}
                      placeholder="Message..."
                      onChange={(e) => handleInputChange(e)}
                      style={{
                        overflowY:
                          message.split("\n").length > 4 ? "scroll" : "hidden",
                        maxHeight: "64px",
                        resize: "none",
                      }}
                    />
                  </div>

                  <div className="send-icon" onClick={() => sendMessage()}>
                    Send
                  </div>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default Chat;
