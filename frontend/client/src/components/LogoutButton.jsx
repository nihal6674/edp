import { useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";

const LogoutButton = () => {
    const dispatch = useDispatch();

    const handleLogout = () => {
        // clear from Redux store
        dispatch(logout());

        // optionally clear localStorage/sessionStorage
        localStorage.removeItem("persist:root");

        // redirect to login or homepage
        window.location.href = "/login";
    };

    return (
        <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={handleLogout}
        >
            Logout
        </button>
    );
};

export default LogoutButton;
