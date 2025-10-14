import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import { store } from "./store/store";
import { setUser } from "./store/slices/usersSlice";
import ToastProvider from "./components/ToastProvider";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import SigninPage from "./pages/Signin";
import SignupPage from "./pages/Signup";
import Profiles from "./pages/Profiles";
import ScrollToTop from "./components/ScrollToTop";

function AppContent() {
  const location = useLocation();
  const hideNavbar =
    location.pathname === "/signin" || location.pathname === "/signup";

  return (
    <>
      {!hideNavbar && <Navbar />}
      <div className={!hideNavbar ? "pt-28" : ""}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/signin" element={<SigninPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </>
  );
}

function AppInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        dispatch(setUser(user));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
      }
    }
  }, [dispatch]);

  return <AppContent />;
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <ToastProvider />
        <ScrollToTop />
        <AppInitializer />
      </Router>
    </Provider>
  );
}

export default App;
