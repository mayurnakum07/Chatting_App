import { Redirect, Route, Switch } from "react-router-dom";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";
// import "./theme/darkTheme.css";
import Home from "./pages/Home";
import { auth, db } from "./helper/fb";
import { useAuthStore } from "./store/authStore";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import { doc, getDoc } from "firebase/firestore";
import Chat from "./pages/Chat";
import Users from "./pages/Users";
import AppLoader from "./components/AppLoader";

setupIonicReact();

console.log("auth", auth.currentUser);

const PublicRoute = () => (
  <Switch>
    <Route exact path="/login" component={Login} />
    <Route exact path="/register" component={Signup} />
    <Route render={() => <Redirect to="/login" />} />
  </Switch>
);

const PrivateRoute = () => (
  <Switch>
    <Route exact path="/home" component={Home} />
    <Route exact path="/users" component={Users} />
    <Route exact path="/chat/:chatId" component={Chat} />
    <Redirect to="/home" />
  </Switch>
);

const App: React.FC = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        console.log("authUser: ", authUser);
        const docRef = doc(db, "users", authUser.uid);
        const userSnap = await getDoc(docRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          console.log('userData: ', userData);
          setUser({
            uid: authUser.uid,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            photoURL: userData.photoURL,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <AppLoader />;

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          {user ? <PrivateRoute /> : <PublicRoute />}
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
