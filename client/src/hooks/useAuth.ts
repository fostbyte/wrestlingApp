import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchUser() {
  const res = await fetch("/api/auth/user", {credentials: "include"});
  if (!res.ok) {
    if (res.status === 401) {
      return null;
    }
    throw new Error("Failed to fetch user");
  }
  return res.json();
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to login");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include" 
      });
      if (!res.ok) {
        throw new Error("Failed to register");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/logout", { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to logout");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["user"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
  };
}

