import axiosInstance from "./axiosInstance"

export const loginEndpoint = async (credentials)=>{
    try {
        const response = await axiosInstance.post("admin/api/v1/auth/login/", credentials);
        return response.data;
        
    } catch (error) {
        console.log(error);
    }
}
 
export const refreshEndpoint = async (credentials)=>{
    try {
        const response = await axiosInstance.post("admin/api/v1/auth/refresh/", credentials);
        return response.data;
    } catch (error) {
        console.log(error);
    }
}   
