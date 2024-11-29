import axios from 'axios';
import { GoogleLogin } from 'react-google-login'
import { useNavigate } from 'react-router-dom';

const clientId = "714826473195-mkbur5p2vel0mtc8o8suvr94rdni8n4g.apps.googleusercontent.com"

export default function Login() {
    const navigate=useNavigate()
    const onSuccess = async (res) => {
        console.log("SUCCESS:", res.profileObj);
        localStorage.setItem("user-details",JSON.stringify(res));
        try {
            const isAdmin=await axios.get(`http://localhost:8000/is_admin/${res.profileObj.googleId}`)
            localStorage.setItem("is-admin",isAdmin.data)
    
            
            const newUser = {
                employee_id: res.profileObj.googleId,
                employee_name: res.profileObj.givenName,
                employee_email: res.profileObj.email,
            };    
    
                await axios.post(`http://localhost:8000/create-user/${res.profileObj.googleId}`, newUser);
                console.log('New user added to the database');
                navigate('/dashboard');
            }
         catch (err) {
            console.error('Error during user authentication', err);
        }
    };
    function onFailure(res) {
        console.log("Failure");
        navigate('/login-unsuccessful');
    }
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-center">Login to Task Tracker Application</h2>
                <GoogleLogin
                    clientId={clientId}
                    buttonText='Login with Google'
                    onSuccess={onSuccess}
                    onFailure={onFailure}
                    cookiePolicy={'single_host_origin'}
                    isSignedIn={true}
                    className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
                />
            </div>
        </div>
    );
}