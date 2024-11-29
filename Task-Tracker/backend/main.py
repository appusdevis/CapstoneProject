from fastapi import FastAPI,  HTTPException,  Depends,  status
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import models
from datetime import date
from typing import Annotated, Optional
from database import engine, SessionLocal
from sqlalchemy.orm import Session
import json
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
models.Base.metadata.create_all(bind=engine)


class ProjectBase(BaseModel):
    project_name:  str
    project_description: str
    start_date: date
    end_date: date
    project_owner_id:  str


class UpdateProjectBase(BaseModel):
    project_name: Optional[str] = None
    project_description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    project_owner_id: Optional[str] = None


class TaskBase(BaseModel):
    task_name: str
    task_description: str
    task_status: str
    task_owner_id: str
    due_date: date
    project_id: str


class UpdateTaskBase(BaseModel):
    task_name: Optional[str] = None
    task_description: Optional[str] = None
    task_status: Optional[str] = None
    task_owner_id: Optional[str] = None
    due_date: Optional[date] = None
    project_id: Optional[str] = None


class EmployeeBase(BaseModel):
    employee_id: str
    employee_name: str
    employee_email: str


class RoleBase(BaseModel):
    role_id:  int
    role_name:  str


class UserRoleBase(BaseModel):
    role_id:  int
    project_id:  str
    employee_id:  str


class UpdateUserRoleBase(BaseModel):
    role_id: Optional[int] = None
    project_id: Optional[str] = None
    employee_id: Optional[str] = None


class AdminBase(BaseModel):
    employee_id:  str


class AdminBase(BaseModel):
    employee_id: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]


def check_admin_id(user_id: str, db: db_dependency):
    is_admin = db.query(models.Admin).filter(
        models.Admin.employee_id == user_id).first()
    if is_admin:
        return True
    return False


def get_user_role_project_internal(user_id: str, project_id: str, db: db_dependency):
    user = db.query(models.UserRole).filter(models.UserRole.employee_id == user_id,
                                            models.UserRole.project_id == project_id).first()
    if user:
        return user.role_id
    else:
        return 0


@app.post("/create-project/{user_id}", status_code=status.HTTP_201_CREATED)
async def create_project(user_id: str, project: ProjectBase, db: db_dependency):
    if check_admin_id(user_id, db):
        db_project = models.Project(**project.dict())
        db.add(db_project)
        db.commit()
    else:
        raise HTTPException(403, detail="Access Denied")


@app.get('/user-role/{user_id}/{project_id}', status_code=status.HTTP_200_OK)
async def get_user_role_project(user_id: str, project_id: str, db: db_dependency):
    user = db.query(models.UserRole).filter(models.UserRole.employee_id == user_id,
                                            models.UserRole.project_id == project_id).first()
    if user:
        return user.role_id
    else:
        return 0


@app.post("/create-task/{project_id}/{user_id}", status_code=status.HTTP_201_CREATED)
async def create_task(project_id: str, user_id: str, task: TaskBase, db: db_dependency):
    admin = check_admin_id(user_id, db)
    task_creator = get_user_role_project_internal(user_id, project_id, db)
    if admin or task_creator == 2:
        db_task = models.Task(**task.dict())
        db.add(db_task)
        db.commit()
    else:
        raise HTTPException(403, detail="Access Denied")


@app.get("/user/{user_id}", status_code=status.HTTP_200_OK)
async def get_user(user_id: str, db: db_dependency):
    users = db.query(models.Employee).all()
    if users is None:
        raise HTTPException(status_code=404,  detail="No projects")
    return users


@app.post("/create-user/{user_id}", status_code=status.HTTP_201_CREATED)
async def create_users(user_id: str, emp: EmployeeBase, db: db_dependency):
    user_exists = db.query(models.Employee).filter(
        models.Employee.employee_id == user_id).first()
    if user_exists:
        return {"detail": "User Already Exists"}
    else:
        db_emp = models.Employee(**emp.dict())
        db.add(db_emp)
        db.commit()


@app.get('/projects/{project_id}/{user_id}', status_code=status.HTTP_200_OK)
async def read_project(project_id: str, user_id: str, db: db_dependency):
    admin = check_admin_id(user_id, db)
    user_role = get_user_role_project_internal(user_id, project_id, db)
    if admin or user_role:
        project = db.query(models.Project).filter(
            models.Project.project_id == project_id).first()
        if project is None:
            raise HTTPException(status_code=404, detail='Project not found')
        return project
    else:
        raise HTTPException(403, detail="Access Denied")


@app.get('/user-role/{user_id}', status_code=status.HTTP_200_OK)
async def read_user_role(user_id: str, db: db_dependency):
    projects = db.query(models.UserRole).filter(
        models.UserRole.employee_id == user_id).all()
    if projects is None:
        raise HTTPException(status_code=404,  detail='Projects not found')
    return projects


@app.get('/tasks/{task_id}', status_code=status.HTTP_200_OK)
async def read_task(task_id: str, db: db_dependency):
    task = db.query(models.Task).filter(models.Task.task_id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404,  detail="Task not found")
    return task


@app.delete('/tasks/{task_id}/{user_id}/{project_id}', status_code=status.HTTP_200_OK)
async def delete_task(task_id: str, user_id: str, project_id: str, db: db_dependency):
    user_role = get_user_role_project_internal(user_id, project_id, db)
    admin = check_admin_id(user_id, db)
    print(user_role)
    if admin or user_role == 2:
        task = db.query(models.Task).filter(
            models.Task.task_id == task_id).first()
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")
        db.delete(task)
        db.commit()
    else:
        raise HTTPException(status_code=403, detail="Access Denied")


def delete_user_role(project_id: str, user_id: str, db: db_dependency):
    admin = check_admin_id(user_id, db)
    if admin:
        db_user_roles = db.query(models.UserRole).filter(
            models.UserRole.project_id == project_id).all()
        print(db_user_roles)

        if db_user_roles is None:
            raise HTTPException(status_code=404, detail="User role not found")
        for user_role in db_user_roles:
            db.delete(user_role)
        db.commit()
    else:
        raise HTTPException(status_code=403, detail="Access Denied")


@app.delete('/delete-project/{project_id}/{user_id}', status_code=status.HTTP_200_OK)
async def delete_project(project_id: str, user_id: str, db: db_dependency):
    admin = check_admin_id(user_id, db)
    if admin:
        project = db.query(models.Project).filter(
            models.Project.project_id == project_id).first()
        if project is None:
            raise HTTPException(status_code=404, detail="Project not found")
        delete_user_role(project_id, user_id, db)
        db.delete(project)
        db.commit()
    else:
        raise HTTPException(status_code=403, detail="Access Denied")


@app.get('/projects/{user_id}', status_code=status.HTTP_200_OK)
async def get_projects(user_id: str, db: db_dependency):
    admin = check_admin_id(user_id, db)
    projects = []
    if admin:
        projects = db.query(models.Project).all()
    else:
        project = db.query(models.UserRole).filter(
            models.UserRole.employee_id == user_id)
        project_ids = [i.project_id for i in project]
        for i in project_ids:
            projects.append(db.query(models.Project).filter(
                models.Project.project_id == i).first())
    if projects is None:
        raise HTTPException(status_code=404,  detail="No projects")
    return projects


@app.get('/{project_id}/tasks/', status_code=status.HTTP_200_OK)
async def get_tasks(project_id: str, db: db_dependency):
    tasks = db.query(models.Task).all()
    if tasks is None:
        raise HTTPException(status_code=404,  detail="No projects")
    return tasks


@app.put('/update-project/{project_id}/{user_id}', status_code=status.HTTP_202_ACCEPTED)
async def update_project(project_id: str, user_id: str, project: UpdateProjectBase, db: db_dependency):
    admin = check_admin_id(user_id, db)
    if admin:
        db_project = db.query(models.Project).filter(
            models.Project.project_id == project_id).first()
        for key, value in project.model_dump(exclude_unset=True).items():
            setattr(db_project, key, value)
        db.commit()
    else:
        raise HTTPException(status_code=403, detail="Access Denied")


@app.put('/update-task/{task_id}/{user_id}/{project_id}', status_code=status.HTTP_202_ACCEPTED)
async def update_task(task_id: str, user_id: str, project_id: str, task: UpdateTaskBase, db: db_dependency):
    admin = check_admin_id(user_id, db)
    user_role = get_user_role_project_internal(user_id, project_id, db)
    if admin or user_role == 2:

        db_task = db.query(models.Task).filter(
            models.Task.task_id == task_id).first()
        for key, value in task.model_dump(exclude_unset=True).items():
            setattr(db_task, key, value)
        db.commit()
    elif user_role == 3:
        db_task = db.query(models.Task).filter(
            models.Task.task_id == task_id).first()
        db_task.task_status = task.task_status
        db.commit()
    else:
        raise HTTPException(status_code=403, detail="Access Denied")


@app.post('/create-role/{user_id}', status_code=status.HTTP_201_CREATED)
async def create_role(user_id: str, role: RoleBase, db: db_dependency):
    admin = check_admin_id(user_id, db)
    if admin:
        db_role = models.Role(**role.dict())
        db.add(db_role)
        db.commit()
    else:
        raise HTTPException(status_code=403, detail='Access Denied')


@app.post('/create-user-role/{user_id}', status_code=status.HTTP_201_CREATED)
async def create_user_role(user_id: str, user_role: UserRoleBase, db: db_dependency):
    admin = check_admin_id(user_id, db)
    if admin:
        exist_user = db.query(models.UserRole).filter(models.UserRole.employee_id == user_role.employee_id,
                                                      models.UserRole.project_id == user_role.project_id).first()
        if exist_user:
            return {"detail": "User already exists"}
        db_role = models.UserRole(**user_role.dict())
        db.add(db_role)
        db.commit()
        return {"detail": "Success"}
    else:
        raise HTTPException(status_code=403, detail="Access Denied")


@app.put('/update-user-role/{user_role_id}/{user_id}', status_code=status.HTTP_202_ACCEPTED)
async def update_user_role(user_id: str, user_role_id: int, user_role: UpdateUserRoleBase, db: db_dependency):
    admin = check_admin_id(user_id, db)
    if admin:
        db_user_role = db.query(models.UserRole).filter(
            models.UserRole.user_role_id == user_role_id).first()
        for key, value in user_role.model_dump(exclude_unset=True).items():
            setattr(db_user_role, key, value)
        db.commit()
    else:
        raise HTTPException(status_code=403, detail="Access Denied")


@app.get('/is_admin/{user_id}', status_code=status.HTTP_200_OK)
async def check_admin(user_id: str, db: db_dependency):
    is_admin = check_admin_id(user_id, db)
    return is_admin


@app.get("/user/{role_id}/{user_id}/{project_id}", status_code=status.HTTP_200_OK)
async def get_assigned_user(role_id: int, user_id: str, project_id: str, db: db_dependency):
    admin = check_admin_id(user_id, db)
    if admin:
        users = db.query(models.UserRole).filter(
            models.UserRole.project_id == project_id).all()
        if users is None:
            return None
        Required_users = []
        if role_id == 2:
            for user in users:
                if user.role_id == 2:
                    Task_creator = db.query(models.Employee).filter(
                        models.Employee.employee_id == user.employee_id).first()
                    Required_users.append(Task_creator)
        else:
            for user in users:
                if user.role_id == 3:
                    Read_only_user = db.query(models.Employee).filter(
                        models.Employee.employee_id == user.employee_id).first()
                    Required_users.append(Read_only_user)
        return Required_users
    else:
        raise HTTPException(403, detail="Access Denied")
