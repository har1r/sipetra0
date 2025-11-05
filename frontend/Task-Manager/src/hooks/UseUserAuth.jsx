import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/UserContexts";

export const UseUserAuth = () => {
  const { user, loading } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      // redirect hanya setelah loading selesai dan user tetap null
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);
};
