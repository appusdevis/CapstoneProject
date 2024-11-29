import { GoogleLogout } from 'react-google-login'
import { useNavigate } from 'react-router-dom';

const clientId="714826473195-mkbur5p2vel0mtc8o8suvr94rdni8n4g.apps.googleusercontent.com"
export default function Logout(){
    const navigate=useNavigate();
    function onSuccess(){
        console.log("SUCCESSFULLY LOGGED OUT");
        navigate('/');
    }

    return <div className='flex justify-end'>
    <GoogleLogout
    clientId={clientId}
    buttonText='Logout'
    onLogoutSuccess={onSuccess}
    />
    </div>

}