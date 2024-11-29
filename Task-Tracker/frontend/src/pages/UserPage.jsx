import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserPage = () => {
    const [users, setUsers] = useState([]);
    const userId=JSON.parse(localStorage.getItem("user-details")).googleId;
    const admin=(localStorage.getItem("is-admin")=="true");
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/user/${userId}`);
                setUsers(response.data);
            } catch (err) {
                console.error('Failed to fetch users', err);
            }
        };

        fetchUsers();
    }, []);

    return (
        <div>
        {admin ? <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <h1 className="text-4xl font-bold mb-4">User List</h1>
            <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.employee_id}>
                                <td className="px-6 py-4 whitespace-nowrap">{user.employee_id}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{user.employee_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{user.employee_email}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>:<div><h1 className='text-4xl flex justify-center'>Access Denied</h1></div>}
        </div>
    );
};

export default UserPage;