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
  where,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { useLocation, useHistory } from "react-router";
import { useAuthStore } from "../store/authStore";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { db } from "../helper/fb";
import "../theme/chat.css";

const Chat: React.FC = () => {
  const { user } = useAuthStore();
  const history = useHistory();
  const searchParams = new URLSearchParams(useLocation().search);
  const otherUserId = searchParams.get("other");
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const contentRef = useRef<HTMLIonContentElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showOptions, setShowOptions] = useState<number | null>(null);
  const [editedText, setEditedText] = useState("");

  // Create or fetch chat room
  useEffect(() => {
    const initChatRoom = async () => {
      if (!user?.uid || !otherUserId) return;

      const q = query(
        collection(db, "chat_rooms"),
        where("chatType", "==", "1v1"),
        where("participants", "array-contains", user.uid)
      );
      const snapshot = await getDocs(q);

      let existingRoom = null;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.participants.includes(otherUserId)) {
          existingRoom = docSnap;
          break;
        }
      }

      if (existingRoom) {
        setChatId(existingRoom.id);
      } else {
        const newRoomRef = doc(collection(db, "chat_rooms"));
        const roomData = {
          chatType: "1v1",
          createdAt: serverTimestamp(),
          participants: [user.uid, otherUserId],
          joiningData: [
            { user: user.uid, joinedAt: Date.now() },
            { user: otherUserId, joinedAt: Date.now() },
          ],
        };
        await setDoc(newRoomRef, roomData);
        setChatId(newRoomRef.id);
      }
    };

    initChatRoom();
  }, [user, otherUserId]);

  // Load messages
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chat_messages"),
      where("chatId", "==", chatId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
      console.log("msgs: ", msgs);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [chatId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      contentRef.current?.scrollToBottom(300);
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !chatId || !user?.uid) return;

    const payload = {
      chatId,
      content: message.trim(),
      senderId: user.uid,
      messageType: "text",
      timestamp: serverTimestamp(),
      reactions: [],
    };

    await addDoc(collection(db, "chat_messages"), payload);
    setMessage("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  const SkeletonMessageLoader = () => (
    <div className="skeleton-message">
      <div className="skeleton-user-image" />
      <div className="skeleton-content">
        <div className="skeleton-chat" />
        <div className="skeleton-time" />
      </div>
    </div>
  );

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, "chat_messages", messageId));
      setShowOptions(null);
    } catch (error) {
      console.error("Error deleting message: ", error);
    }
  };

  const startEditing = (message: any) => {
    setEditingMessageId(message.id);
    setEditedText(message.content); // assuming message has `text`
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditedText("");
  };

  const handleEditSubmit = async (messageId: string) => {
    try {
      setEditedText("");
      setShowOptions(null);
      await updateDoc(doc(db, "chat_messages", messageId), {
        content: editedText,
        editedAt: new Date(),
        isEdited: true,
      });
      setEditingMessageId(null);
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

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
                                {editingMessageId === item.id ? (
                                  <div className="edit-message-box">
                                    <input
                                      value={editedText}
                                      onChange={(e) =>
                                        setEditedText(e.target.value)
                                      }
                                      className="edit-input"
                                    />
                                    <div className="edit-actions">
                                      <Check
                                        onClick={() =>
                                          handleEditSubmit(item.id)
                                        }
                                        className="check-icon"
                                      />
                                      <X
                                        onClick={cancelEditing}
                                        className="cancel-icon"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <span>{item.content}</span>
                                )}
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
                                  onClick={() => startEditing(item)}
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

                  <div
                    className="send-icon"
                    onClick={() => handleSendMessage()}
                  >
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
