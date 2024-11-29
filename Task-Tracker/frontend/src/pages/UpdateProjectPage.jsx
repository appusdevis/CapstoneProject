import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const UpdateProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { project } = location.state || {};
  const [projectName, setProjectName] = useState(project?.project_name || '');
  const [projectDescription, setProjectDescription] = useState(project?.project_description || '');
  const [startDate, setStartDate] = useState(project?.start_date || '');
  const [endDate, setEndDate] = useState(project?.end_date || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const userId=JSON.parse(localStorage.getItem("user-details")).googleId;
  const admin=(localStorage.getItem("is-admin")=="true");

  const handleUpdate = async (e) => {

    
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`http://localhost:8000/update-project/${projectId}/${userId}`, {
        project_name: projectName,
        project_description: projectDescription,
        start_date: startDate,
        end_date: endDate,
      });
      navigate(`/projects/${projectId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-4">Loading...</div>;
  if (error) return <div className="text-center mt-4 text-red-500">Error: {error}</div>;

  return (
    <div>
    {admin ? <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Update Project</h1>
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Project Description</label>
          <textarea
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Update Project
        </button>
      </form>
    </div>:<div><h1 className='text-4xl flex justify-center'>Access Denied</h1></div>}
    </div>
  );
};

export default UpdateProjectPage;