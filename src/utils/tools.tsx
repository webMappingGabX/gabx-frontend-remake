export function getCookie(name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp("(?:^|; )" + escaped + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export const hasToken  = () => {
  return localStorage.getItem("accessToken") !== null;
}

export const isFullyAuthenticated = (isAuthenticated : boolean) => {
  return isAuthenticated && localStorage.getItem("accessToken") !== null;
}

/*
export function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};
*/