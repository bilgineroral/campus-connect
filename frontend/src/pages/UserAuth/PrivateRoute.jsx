import Auth from "./Auth";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar.jsx";
import { WebSocketProvider } from '../../components/WebSockets/WebSocketContext.jsx';


const PrivateRoute = () => {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const auth = Auth.isAuthenticated();

  return auth ? (
    <WebSocketProvider token={token}>
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>
          <Sidebar />
        </div>
        <div style={{ flex: 3 }}>
          <Outlet />
        </div>
      </div>
    </WebSocketProvider>
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  )

}

export default PrivateRoute;
