import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Logout from '../components/Logout.jsx';
import Select from 'react-select';
const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [employees,setEmployees]=useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskId, setTaskId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState('new');
  const [taskOwnerId, setTaskOwnerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [refresh,setRefresh]=useState(0)
  const [showAddTaskCreatorForm,setShowAddTaskCreatorForm]=useState(false);
  const [showAddReadOnlyUserForm,setShowAddReadOnlyUserForm]=useState(false);
  const [showSuccessMessage,setShowSuccessMessage]=useState(false)
  const userId=JSON.parse(localStorage.getItem("user-details")).googleId;
  const admin=(localStorage.getItem("is-admin")=="true");
  const [isTaskCreator,setIsTaskCreator]=useState(false);
  const [taskCreators,setTaskCreators]=useState([])
  const [taskReadOnlyUsers,setTaskReadOnlyUsers]=useState([])
  const filteredEmployees=employees.filter(employee => 
    !(taskCreators.find(taskCreator => taskCreator.employee_id === employee.value)||(
      taskReadOnlyUsers.find(taskReadOnlyUser => taskReadOnlyUser.employee_id === employee.value)
    )||(
      employee.value===JSON.parse(localStorage.getItem("user-details")).googleId
    ))
  );
  const openUpdateForm = (task) => {
    setCurrentTask(task);
    setTaskId(task.task_id);
    setTaskName(task.task_name);
    setTaskDescription(task.task_description);
    setTaskStatus(task.task_status);
    setTaskOwnerId(task.task_owner_id);
    setDueDate(task.due_date);
    setShowUpdateForm(true);
};

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    const updatedTask = {
        ...currentTask,
        task_name: taskName,
        task_description: taskDescription,
        task_status: taskStatus,
        task_owner_id: taskOwnerId,
        due_date: dueDate,
    };
    try {
        await axios.put(`http://localhost:8000/update-task/${currentTask.task_id}/${userId}/${projectId}`, updatedTask);
        setTasks(tasks.map(task => (task.task_id === currentTask.task_id ? updatedTask : task)));
        setShowUpdateForm(false);
        setCurrentTask(null);
    } catch (err) {
        console.error('Failed to update task', err);
    }
  };
  useEffect(() => {
    const getProjectData = async () => {
      try {
        const projectResponse = await axios.get(`http://localhost:8000/projects/${projectId}/${userId}`);
        const employeeResponse = await axios.get(`http://localhost:8000/user/${userId}`);
        const roleResponse=await axios.get(`http://localhost:8000/user-role/${userId}/${projectId}`);
        if(admin){
          const taskCreatorsResponse=await axios.get(`http://localhost:8000/user/2/${userId}/${projectId}`);
          //const taskReadOnlyUserResponse=await axios.get(`http://localhost:8000/user/3/${userId}/${projectId}`);
          setTaskCreators(taskCreatorsResponse.data)
          //setTaskReadOnlyUsers(taskReadOnlyUserResponse.data)
          }
        if(roleResponse.data===2){
          setIsTaskCreator(true);
        }
        else{
          setIsTaskCreator(false);
        }
        if(admin||roleResponse.data==2){
          const tasksResponse = await axios.get(`http://localhost:8000/${projectId}/tasks`);
          if(tasksResponse.data!=null){
          setTasks(tasksResponse.data);
          }
          else{
            setTasks([]);
          }
        }
        else{
          const tasksResponse = await axios.get(`http://localhost:8000/task/read-only-user/${projectId}/${userId}`);
          setTasks(tasksResponse.data);
        }
        const employeeOptions = employeeResponse.data.map(employee => ({
          value: employee.employee_id,
          label: `${employee.employee_name} (${employee.employee_email})`,
      }));
        setProject(projectResponse.data);
        setEmployees(employeeOptions);
        
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getProjectData();
  }, [projectId,refresh]);

  const handleDeleteProject = async () => {
    try {
      const tasksResponse = await axios.get(`http://localhost:8000/${projectId}/tasks/`);
      const projectTasks = tasksResponse.data;

      for (const task of projectTasks) {
        await axios.delete(`http://localhost:8000/tasks/${task.task_id}/${userId}/${projectId}`);
      }
      await axios.delete(`http://localhost:8000/delete-project/${projectId}/${userId}`);
      navigate('/projects');
    } catch (err) {
      console.error('Failed to delete project and its tasks', err);
    }
  };

  const handleUpdate = () => {
    navigate(`/update-project/${projectId}`, { state: { project } });
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    const newTask = {
      // task_id:taskId,
      task_name: taskName,
      task_description: taskDescription,
      task_status: taskStatus,
      task_owner_id: userId,
      due_date: dueDate,
      project_id: projectId,
    };
    //console.log(projectId)
    
    try {
      await axios.post(`http://localhost:8000/create-task/${projectId}/${userId}`, newTask);
      setTasks([...tasks,newTask])
      setShowTaskForm(false);
      //setTaskId(response.data.task_id);
      setTaskName('');
      setTaskDescription('');
      setTaskStatus('new');
      setTaskOwnerId('');
      setDueDate('');
      setRefresh(refresh+1)
    } catch (err) {
      console.error('Failed to add task', err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!project) return <p>Project not found</p>;
  const handleAddTaskCreator=async(e)=>{
    e.preventDefault();
    const employeeId=selectedEmployee.value;
    const roleId=2;
    const newProjectRole={
      employee_id:employeeId,
      role_id:roleId,
      project_id:projectId
    }
    try{
      await axios.post(`http://localhost:8000/create-user-role/${userId}`,newProjectRole);
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 1000);
      //setShowAddTaskCreatorForm(false);
      setRefresh(refresh+1)
    }
    catch(e){
      console.error('Failed to add task creator', e);
    }
    setSelectedEmployee(null);

  }
  const handleAddReadOnlyUser=async(e)=>{
    e.preventDefault();
    const employeeId=selectedEmployee.value;
    const roleId=3;
    const newProjectRole={
      employee_id:employeeId,
      role_id:roleId,
      project_id:projectId
    }
    try{
      await axios.post(`http://localhost:8000/create-user-role/${userId}`,newProjectRole);
      const taskUser={
        task_id:taskId,
        employee_id:employeeId
      }
      await axios.post(`http://localhost:8000/create-read-only-user/${userId}/${projectId}/${taskId}`,taskUser);
      const taskReadOnlyUserResponse=await axios.get(`http://localhost:8000/project/read-only-users/${projectId}/${taskId}/${userId}`);
      setTaskReadOnlyUsers(taskReadOnlyUserResponse.data);
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 1000);
      //setShowAddReadOnlyUserForm(false);
      setRefresh(refresh+1)
      
    }
    catch(e){
      console.error('Failed to add read only user', e);
    }
    setSelectedEmployee(null);
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-b ">
      <Link to="/projects" className='text-xl text-gray-700 hover:text-gray-900'>Projects</Link>
      <Logout/>
      <h1 className="text-5xl font-bold mb-4">{project.project_name}</h1>
      <p className="text-gray-700 mb-4">{project.project_description}</p>
      <p className="text-gray-700"><strong>Start Date:</strong> {new Date(project.start_date).toLocaleDateString()}</p>
      <p className="text-gray-700"><strong>End Date:</strong> {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}</p>
      <div className="flex flex-wrap space-x-4 mb-6 my-4">
        {admin && <button onClick={async()=>{
           const taskCreatorsResponse=await axios.get(`http://localhost:8000/user/2/${userId}/${projectId}`);
           setTaskCreators(taskCreatorsResponse.data)
           setShowAddTaskCreatorForm(true);
          }} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 my-2">Add Task Creator</button>}
        {admin && <button onClick={handleDeleteProject} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 my-2">Delete Project</button>}
        {admin && <button onClick={handleUpdate} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-700 my-2">Update Project</button>}
        {(admin || isTaskCreator) && <button onClick={() => setShowTaskForm(true)} className="bg-green-500 text-white px-4 py-2 my-2 rounded hover:bg-green-700">Add Task</button>}
      </div>
      <h2 className="text-2xl font-semibold mt-6 mb-4">Tasks</h2>
      {tasks.length === 0 ? (
        <p>No tasks available for this project.</p>
      ) : (
        tasks.map((task) => (
          
          <div key={task.task_id} className="task-item hover:shadow-lg border p-4 mb-4 flex justify-between items-center rounded-lg bg-gray-100 border-gray-400">
              <div>
                  <h3 className="text-2xl font-bold">{task.task_name}</h3>
                  <p>{task.task_description}</p>
                  <label className="block mt-2">
                      Status:
                      <select
                          value={task.task_status}
                          onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                  await axios.put(`http://localhost:8000/update-task/${task.task_id}/${userId}/${projectId}`, { ...task, task_status: newStatus });
                                  setTasks(tasks.map(t => (t.task_id === task.task_id ? { ...t, task_status: newStatus } : t)));
                              } catch (err) {
                                  console.error('Failed to update task status', err);
                              }
                          }}
                          className="ml-2 p-1 border rounded"
                      >
                          <option value="new">New</option>
                          <option value="in-progress">In Progress</option>
                          <option value="blocked">Blocked</option>
                          <option value="completed">Completed</option>
                          <option value="not-started">Not Started</option>
                      </select>
                  </label>
                  <p className="mt-2">Due Date: {new Date(task.due_date).toLocaleDateString()}</p>
              </div>
              <div className="flex space-x-2">
                  {(admin||isTaskCreator) && <button onClick={() => openUpdateForm(task)} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-700">Update Task</button>}
                  {(admin||isTaskCreator) && <button onClick={async () => {
                      try {
                          
                          await axios.delete(`http://localhost:8000/tasks/${task.task_id}/${userId}/${projectId}`);
                          setTasks(tasks.filter(t => t.task_id !== task.task_id));
                      } catch (err) {
                          console.error('Failed to delete task', err);
                      }
                  }} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700">Delete Task</button>}
                  {(admin||isTaskCreator) && <button onClick={async()=>{
                    setTaskId(task.task_id);
                    const taskReadOnlyUserResponse=await axios.get(`http://localhost:8000/project/read-only-users/${projectId}/${task.task_id}/${userId}`);
                    setTaskReadOnlyUsers(taskReadOnlyUserResponse.data);
                    setShowAddReadOnlyUserForm(true);}} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700">Assign Read-only User</button>}
        
              </div>
          </div>
      )))}
      {showTaskForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4">Add New Task</h2>
            <form onSubmit={handleAddTask}>
              <div className="mb-4">

              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Task Name</label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Task Description</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Task Status</label>
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="completed">Completed</option>
                  <option value="not started">Not Started</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700">Add Task</button>
                <button type="button" onClick={() => setShowTaskForm(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showUpdateForm && (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h2 className="text-xl font-bold mb-4">Update Task</h2>
            <form onSubmit={handleUpdateTask}>
                <label className="block mb-2">
                    Task Name
                    <input type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)} className="w-full p-2 border rounded" required />
                </label>
                <label className="block mb-2">
                    Task Description
                    <input type="text" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} className="w-full p-2 border rounded" required />
                </label>
                <label className="block mb-2">
                    Task Status
                    <select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)} className="w-full p-2 border rounded" required>
                        <option value="new">New</option>
                        <option value="in-progress">In Progress</option>
                        <option value="blocked">Blocked</option>
                        <option value="completed">Completed</option>
                        <option value="not-started">Not Started</option>
                    </select>
                </label>

                <label className="block mb-4">
                    Due Date
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full p-2 border rounded" required />
                </label>
                <div className="flex justify-end">
                    <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700 mr-2">Update Task</button>
                    <button type="button" onClick={() => setShowUpdateForm(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700">Cancel</button>
                </div>
            </form>
        </div>
    </div>
)}
  {showAddTaskCreatorForm && (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
            {taskCreators.length===0 ?(<h1>No task creators yet</h1>):(
              taskCreators.map((taskCreator) => (
                <div key={taskCreator.employee_id} className="task-item border p-2 px-4 mb-2 flex justify-between items-center rounded-lg bg-zinc-100 text-sm w-full">
                    <div>
                      <h3 className="font-bold">{taskCreator.employee_name}</h3>
                      <p>{taskCreator.employee_email}</p>
                    </div>
                    <div>
                    <button onClick={async ()=>{
              
                      try{
        
                        await axios.delete(`http://localhost:8000/delete-user/2/${userId}/${projectId}/${taskCreator.employee_id}/`);
                        
                      }
                      catch(err){
                        console.log("failed to delete:",err);
                      }
                      setRefresh(refresh+1);
                    }}
                    className="text-red-500 font-bold text-xs h-full hover:bg-red-100">Delete</button>
                    </div>
                  </div>
                ) ))} 
            <h2 className="text-xl font-bold mb-4">Add Task Creator</h2>
            <form onSubmit={handleAddTaskCreator}>
                <label className="block mb-2">
                    User
                    <Select
                            options={filteredEmployees}
                            value={selectedEmployee}
                            onChange={(selectedOption)=>setSelectedEmployee(selectedOption)}
                            isSearchable
                            placeholder="Select an employee"
                            className="w-full"
                        />
                </label>
                <div className="flex justify-end">
                    <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700 mr-2">Add Task Creator</button>
                    <button type="button" onClick={() => {
                      setShowAddTaskCreatorForm(false);
                      setSelectedEmployee(null);
                      }} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700">Exit</button>
                </div>
                
            </form>
        </div>
    </div>
)}
{showAddReadOnlyUserForm && (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
        {taskReadOnlyUsers.length===0 ?(<h1>No task Read Only Users yet</h1>):(
              taskReadOnlyUsers.map((taskReadOnlyUser) => (
                <div key={taskReadOnlyUser.employee_id} className="task-item border p-2 px-4 mb-2 flex justify-between items-center rounded-lg bg-zinc-100 text-sm w-full">
                    <div>
                      <h3 className="font-bold">{taskReadOnlyUser.employee_name}</h3>
                      <p>{taskReadOnlyUser.employee_email}</p>
                    </div>
                    <button onClick={async ()=>{
              
                      try{
                        await axios.delete(`http://localhost:8000/delete-read-only-user/${userId}/${projectId}/${taskReadOnlyUser.employee_id}/${taskId}/`);
                        //await axios.delete(`http://localhost:8000/delete-user/3/${userId}/${projectId}/${taskReadOnlyUser.employee_id}`)
                        const taskReadOnlyUserResponse=await axios.get(`http://localhost:8000/project/read-only-users/${projectId}/${taskId}/${userId}`);
                        setTaskReadOnlyUsers(taskReadOnlyUserResponse.data);
        
                        
                      }
                      catch(err){
                        console.log("failed to delete:",err);
                      }
                      //setRefresh(refresh+1);
                    }}
                    className="text-red-500 font-bold text-xs h-full hover:bg-red-100">Delete</button>
                  </div>
                ) ))}
            <h2 className="text-xl font-bold mb-4">Add Read-only user</h2>
            <form onSubmit={handleAddReadOnlyUser}>
                <label className="block mb-2">
                    User
                    <Select
                            options={filteredEmployees}
                            value={selectedEmployee}
                            onChange={(selectedOption)=>{
                              setSelectedEmployee(selectedOption);
                            }}
                            isSearchable
                            placeholder="Select an employee"
                            className="w-full"
                        />
                </label>
                <div className="flex justify-end">
                    <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700 mr-2">Add Read-only User</button>
                    <button type="button" onClick={() =>{
                      setTaskReadOnlyUsers([]);
                       setShowAddReadOnlyUserForm(false);
                    }} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700">Exit</button>
                </div>
            </form>
        </div>
    </div>
)}
{showSuccessMessage && (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h2 className="text-xl font-bold mb-4">User added successfully</h2>
        </div>
    </div>
)}
    </div>
  );
};

export default ProjectPage;
