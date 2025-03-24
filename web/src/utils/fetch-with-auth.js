async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem("adminToken");
    console.log("Token being sent:", token);
    options.headers = {
        ...options.headers,
        "Authorization": `Bearer ${token}`,
    };

    const response = await fetch(url, options);

    if (response.status === 403) {
        localStorage.removeItem("adminToken");
        alert("Session expired. Please login again.");
        window.location.href = "/login";   // Redirect to login page
        return null;
    }

    return response;
}

export default fetchWithAuth;
 