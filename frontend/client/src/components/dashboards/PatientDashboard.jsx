import PatientPage from "../PatientPage";
import { useSelector } from "react-redux";

export default function PatientDashboard() {
  const { isAuthenticated, details, role } = useSelector((state) => state.auth);
    return( <>
    <PatientPage/>
    </>);
  }
  