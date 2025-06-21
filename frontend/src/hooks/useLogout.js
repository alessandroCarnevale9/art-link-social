import { useAuthContext } from "./useAuthContext";

export const useLogout = () => {
  const { dispatch } = useAuthContext();

  const logout = async () => {
    // remove user JWT from local storage
    localStorage.removeItem("jwt");

    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include", // manda il cookie HTTP-only
    });

    // dispatch logout action
    dispatch({ type: "LOGOUT" });
  };

  return { logout };
};
