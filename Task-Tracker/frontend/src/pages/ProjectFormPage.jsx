import React, { useState } from 'react';
import { Link, useNavigate,NavLink } from 'react-router-dom';
import axios from 'axios';

const ProjectFormPage = ({ onAddProject }) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();
  const userId=JSON.parse(localStorage.getItem("user-details")).googleId;
  const admin=(localStorage.getItem("is-admin")=="true");
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newProject = {
      
      project_name: projectName,
      project_description: projectDescription,
      start_date: startDate,
      end_date: endDate,
      project_owner_id: '1', 
    };

    try {
      await axios.post(`http://localhost:8000/create-project/${userId}`, newProject);
      navigate('/projects');
    } catch (error) {
      console.error('Failed to create project', error);
      navigate('/projects');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-500 to-gray-100 p-4">
      {admin?<form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Add New Project</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700">Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4 ">
          <label className="block text-gray-700">Project Description</label>
          <textarea
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add Project
        </button>
        <Link to="/projects" className="bg-white text-blue-500 mx-5">
          Cancel
        </Link>        
      </form>:<h1>You are not an admin</h1>}
    </div>
    
  );
};

export default ProjectFormPage;