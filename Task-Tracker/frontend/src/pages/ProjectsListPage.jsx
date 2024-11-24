import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchProjects } from '../utils/dataFetcher';
import axios from 'axios';
import Logout from '../components/Logout';

const ProjectsListPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getProjects = async () => {
      try {
        const response = await axios.get('http://localhost:8000/projects');
        setProjects(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getProjects();
  }, []);

  const handleAddProject = (newProject) => {
    setProjects([...projects, newProject]);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="min-h-screen p-4 bg-gradient-to-l bg-gradient-to-b from-orange-500 ">
      <h1 className="text-3xl font-bold mb-6 flex justify-center">Projects</h1>
      <Logout/>
      <button
        onClick={() => navigate('/add-project')}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6"
      >
        Add New Project
      </button>
      {projects.length === 0 ? (
        <p>No projects available.</p>
      ) : (
        projects.map((project) => (
          <Link to={`/projects/${project.project_id}`} key={project.project_id} className="block mb-4">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-300 bg-gradient-to-r from-gray-200 to-gray-300">
              <h2 className="text-2xl font-semibold mb-2">{project.project_name}</h2>
              <p className="text-gray-700 mb-4">{project.project_description}</p>
              <p className="text-gray-500"><strong>Start Date:</strong> {new Date(project.start_date).toLocaleDateString()}</p>
              <p className="text-gray-500"><strong>End Date:</strong> {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}</p>
            </div>
          </Link>
        ))
      )}
    </div>
  );
};

export default ProjectsListPage;
