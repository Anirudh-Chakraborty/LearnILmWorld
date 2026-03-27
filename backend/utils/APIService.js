import axios from 'axios';

class APIService {
    #axiosInstance; //Axios instance for making API calls
    #tokenServiceInstance; //TokenService instance for fetching management token for API calls
    
    constructor(tokenService) {
        // Set Axios baseURL to 100ms API BaseURI
        this.#axiosInstance = axios.create({
            baseURL: "https://api.100ms.live/v2",
            timeout: 60 * 60 * 1000
            //therefore 60*1000 == 1 min and 60*60*1000 == 60 mins == 1 hr
            //1000ms == 1 seconds 
        });
        this.#tokenServiceInstance = tokenService;
        this.#configureAxios();
    }

    #configureAxios() {
        this.#axiosInstance.interceptors.request.use((config) => {
            config.headers = {
                Authorization: `Bearer ${this.#tokenServiceInstance.getManagementToken()}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            };
            return config;
        },
            (error) => Promise.reject(error));
            
        this.#axiosInstance.interceptors.response.use((response) => {
            return response;
        },
            (error) => {
                console.error("Error in making API call", { response: error.response?.data });
                const originalRequest = error.config;
                if (
                    (error.response?.status === 403 || error.response?.status === 401) &&
                    !originalRequest._retry
                ) {
                    console.log("Retrying request with refreshed token");
                    originalRequest._retry = true;

                    // Force refresh Management token on error making API call
                    this.#axiosInstance.defaults.headers.common["Authorization"] = "Bearer " + this.#tokenServiceInstance.getManagementToken(true);
                    try {
                        return this.#axiosInstance(originalRequest);
                    } catch (retryError) {
                        console.error("Unable to Retry!");
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    async get(path, queryParams) {
        const res = await this.#axiosInstance.get(path, { params: queryParams });
        console.log(`get call to path - ${path}, status code - ${res.status}`);
        return res.data;
    }

    async post(path, payload) {
        const res = await this.#axiosInstance.post(path, payload || {});
        console.log(`post call to path - ${path}, status code - ${res.status}`);
        return res.data;
    }
}

// Export it using ES Module syntax
export default APIService ;