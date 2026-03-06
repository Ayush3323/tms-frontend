import axiosInstance from "./axiosInstance"

export const loginEndpoint = async (credentials)=>{
    const response = await axiosInstance.post("admin/api/v1/auth/login/", credentials);
    return response.data;
}
 
export const refreshEndpoint = async (credentials)=>{
    const response = await axiosInstance.post("admin/api/v1/auth/refresh/", credentials);
    return response.data;
}   
