// src/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "/api", // adjust as needed
  withCredentials: true, // important for cookies
});

export default API;
