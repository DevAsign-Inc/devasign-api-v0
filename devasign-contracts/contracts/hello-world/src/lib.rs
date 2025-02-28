#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Bytes, BytesN, Env, Map, Symbol, Vec, String, 
    token::TokenClient
};

// Contract data structures
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Task {
    id: BytesN<32>,
    title: String,
    description: String,
    compensation: i128,
    project_id: BytesN<32>,
    status: TaskStatus,
    applicants: Vec<Address>,
    assigned_developer: Option<Address>,
    completion_date: Option<u64>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TaskStatus {
    Open,
    Assigned,
    InProgress,
    Completed,
    Approved,
    Rejected,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Project {
    id: BytesN<32>,
    name: String,
    manager: Address,
    repository_url: String,
    total_tasks: u32,
}

// Contract state keys - using symbol_short! macro instead of Symbol::short
const TASKS: Symbol = symbol_short!("TASKS");
const PROJECTS: Symbol = symbol_short!("PROJECTS");
const PROJ_TASK: Symbol = symbol_short!("PROJ_TASK"); // Shortened to 8 chars
const USER_ESC: Symbol = symbol_short!("USER_ESC"); // Already 8 chars

#[contract]
pub struct DevAsignContract;

#[contractimpl]
impl DevAsignContract {
    // Project Manager Functions

    // Create a new project
    pub fn create_project(env: Env, manager: Address, name: String, repository_url: String) -> BytesN<32> {
        // Authenticate the caller
        manager.require_auth();

        // Generate a unique project ID
        let timestamp = env.ledger().timestamp();
        
        // Use a timestamp-based approach for ID generation
        let timestamp_bytes = timestamp.to_be_bytes();
        let project_id_preimage = Bytes::from_slice(&env, &timestamp_bytes);
        let project_id = env.crypto().sha256(&project_id_preimage);

        // Create the project
        let project = Project {
            id: project_id.clone(),
            name,
            manager: manager.clone(),
            repository_url,
            total_tasks: 0,
        };

        // Get or initialize projects map
        let mut projects: Map<BytesN<32>, Project> = env.storage().persistent().get(&PROJECTS).unwrap_or(Map::new(&env));

        // Store the project
        projects.set(project_id.clone(), project);
        env.storage().persistent().set(&PROJECTS, &projects);

        // Initialize empty task list for this project
        let project_tasks: Vec<BytesN<32>> = Vec::new(&env);
        let mut project_tasks_map: Map<BytesN<32>, Vec<BytesN<32>>> =
            env.storage().persistent().get(&PROJ_TASK).unwrap_or(Map::new(&env));
        project_tasks_map.set(project_id.clone(), project_tasks);
        env.storage().persistent().set(&PROJ_TASK, &project_tasks_map);

        // Return the project ID
        project_id
    }

    // Create a new task with funds in escrow
    pub fn create_task(
        env: Env,
        project_id: BytesN<32>,
        title: String,
        description: String,
        compensation: i128,
        manager: Address,
        token: Address,
    ) -> BytesN<32> {
        // Get project to verify manager
        let mut projects: Map<BytesN<32>, Project> = env.storage().persistent().get(&PROJECTS).unwrap_or(Map::new(&env));
        let mut project = projects.get(project_id.clone()).expect("Project not found");

        // Verify the caller is the project manager
        if project.manager != manager {
            panic!("Only the project manager can create tasks");
        }
        
        // Require manager authorization
        manager.require_auth();
        
        // Generate a unique task ID - using timestamp and project_id
        let timestamp = env.ledger().timestamp();
        let timestamp_bytes = timestamp.to_be_bytes();
        
        // Combine project_id and timestamp to create a unique task ID
        let mut task_id_preimage = Bytes::new(&env);
        for i in 0..32 {
            task_id_preimage.push_back(project_id.get);
        }
        for byte in timestamp_bytes.iter() {
            task_id_preimage.push_back(*byte);
        }
        
        let task_id = env.crypto().sha256(&task_id_preimage);

        // Create the task
        let task = Task {
            id: task_id.clone(),
            title,
            description,
            compensation,
            project_id: project_id.clone(),
            status: TaskStatus::Open,
            applicants: Vec::new(&env),
            assigned_developer: None,
            completion_date: None,
        };

        // Hold funds in escrow
        Self::deposit_to_escrow(&env, &manager, &token, compensation);

        // Save the task
        let mut tasks: Map<BytesN<32>, Task> = env.storage().persistent().get(&TASKS).unwrap_or(Map::new(&env));
        tasks.set(task_id.clone(), task);
        env.storage().persistent().set(&TASKS, &tasks);

        // Add task to project's task list
        let mut project_tasks_map: Map<BytesN<32>, Vec<BytesN<32>>> =
            env.storage().persistent().get(&PROJ_TASK).unwrap_or(Map::new(&env));
        let mut project_tasks = project_tasks_map.get(project_id.clone()).unwrap_or(Vec::new(&env));
        project_tasks.push_back(task_id.clone());
        project_tasks_map.set(project_id.clone(), project_tasks);
        env.storage().persistent().set(&PROJ_TASK, &project_tasks_map);

        // Update project task count
        project.total_tasks += 1;
        projects.set(project_id, project);
        env.storage().persistent().set(&PROJECTS, &projects);

        task_id
    }

    // Approve developer application
    pub fn approve_application(env: Env, task_id: BytesN<32>, developer: Address, manager: Address) {
        // Get task
        let mut tasks: Map<BytesN<32>, Task> = env.storage().persistent().get(&TASKS).unwrap_or(Map::new(&env));
        let mut task = tasks.get(task_id.clone()).expect("Task not found");

        // Verify project manager
        let projects: Map<BytesN<32>, Project> = env.storage().persistent().get(&PROJECTS).unwrap_or(Map::new(&env));
        let project = projects.get(task.project_id.clone()).expect("Project not found");

        if project.manager != manager {
            panic!("Only the project manager can approve applications");
        }

        manager.require_auth();

        // Verify developer has applied
        let mut found = false;
        for applicant in task.applicants.iter() {
            if applicant == developer {
                found = true;
                break;
            }
        }

        if !found {
            panic!("Developer has not applied for this task");
        }

        // Assign task to developer and update status
        task.status = TaskStatus::Assigned;
        task.assigned_developer = Some(developer.clone());

        // Update task
        tasks.set(task_id, task);
        env.storage().persistent().set(&TASKS, &tasks);
    }

    // Approve completed task
    pub fn approve_completion(env: Env, task_id: BytesN<32>, manager: Address, token: Address) {
        // Get task
        let mut tasks: Map<BytesN<32>, Task> = env.storage().persistent().get(&TASKS).unwrap_or(Map::new(&env));
        let mut task = tasks.get(task_id.clone()).expect("Task not found");

        // Verify project manager
        let projects: Map<BytesN<32>, Project> = env.storage().persistent().get(&PROJECTS).unwrap_or(Map::new(&env));
        let project = projects.get(task.project_id.clone()).expect("Project not found");

        if project.manager != manager {
            panic!("Only the project manager can approve task completion");
        }

        manager.require_auth();

        // Verify task is completed
        if task.status != TaskStatus::Completed {
            panic!("Task is not marked as completed");
        }

        // Get the assigned developer
        let developer = task.assigned_developer.clone().expect("No developer assigned");

        // Release funds from escrow to developer
        Self::release_from_escrow(&env, &manager, &developer, &token, task.compensation);

        // Update task status
        task.status = TaskStatus::Approved;

        // Update task
        tasks.set(task_id, task);
        env.storage().persistent().set(&TASKS, &tasks);
    }

    // Developer Functions

    // Apply for a task
    pub fn apply_for_task(env: Env, task_id: BytesN<32>, developer: Address, _expected_completion: u64) {
        // Get task
        let mut tasks: Map<BytesN<32>, Task> = env.storage().persistent().get(&TASKS).unwrap_or(Map::new(&env));
        let mut task = tasks.get(task_id.clone()).expect("Task not found");

        // Verify task is open
        if task.status != TaskStatus::Open {
            panic!("Task is not open for applications");
        }

        // Require developer authorization
        developer.require_auth();

        // Add developer to applicants if not already applied
        for applicant in task.applicants.iter() {
            if applicant == developer {
                panic!("Developer has already applied for this task");
            }
        }

        task.applicants.push_back(developer);

        // Update task
        tasks.set(task_id, task);
        env.storage().persistent().set(&TASKS, &tasks);
    }

    // Start task: allow assigned developer to mark task as in progress.
    pub fn start_task(env: Env, task_id: BytesN<32>, developer: Address) {
        // Get task
        let mut tasks: Map<BytesN<32>, Task> = env.storage().persistent().get(&TASKS).unwrap_or(Map::new(&env));
        let mut task = tasks.get(task_id.clone()).expect("Task not found");

        // Verify developer is assigned to this task
        if task.assigned_developer != Some(developer.clone()) {
            panic!("Only the assigned developer can start the task");
        }

        // Require developer authorization
        developer.require_auth();

        // Allow starting only if task is Assigned
        if task.status != TaskStatus::Assigned {
            panic!("Task is not in the Assigned state");
        }

        task.status = TaskStatus::InProgress;

        // Update task
        tasks.set(task_id, task);
        env.storage().persistent().set(&TASKS, &tasks);
    }

    // Mark task as completed
    pub fn mark_task_completed(env: Env, task_id: BytesN<32>, developer: Address) {
        // Get task
        let mut tasks: Map<BytesN<32>, Task> = env.storage().persistent().get(&TASKS).unwrap_or(Map::new(&env));
        let mut task = tasks.get(task_id.clone()).expect("Task not found");

        // Verify developer is assigned to this task
        if task.assigned_developer != Some(developer.clone()) {
            panic!("Only the assigned developer can mark the task as completed");
        }

        // Require developer authorization
        developer.require_auth();

        // Verify task is in progress
        if task.status != TaskStatus::InProgress {
            panic!("Task is not in progress");
        }

        // Update task status and record completion date
        task.status = TaskStatus::Completed;
        task.completion_date = Some(env.ledger().timestamp());

        // Update task
        tasks.set(task_id, task);
        env.storage().persistent().set(&TASKS, &tasks);
    }

    // Helper Functions

    // Deposit funds to escrow
    fn deposit_to_escrow(env: &Env, from: &Address, token: &Address, amount: i128) {
        // Transfer tokens from user to contract
        let token_client = TokenClient::new(env, token);
        token_client.transfer(from, &env.current_contract_address(), &amount);

        // Create or update escrow balance
        let mut escrow: Map<Address, i128> = env.storage().persistent().get(&USER_ESC).unwrap_or(Map::new(env));
        let current_balance = escrow.get(from.clone()).unwrap_or(0);
        escrow.set(from.clone(), current_balance + amount);
        env.storage().persistent().set(&USER_ESC, &escrow);
    }

    // Release funds from escrow
    fn release_from_escrow(env: &Env, from: &Address, to: &Address, token: &Address, amount: i128) {
        // Verify sufficient balance in escrow
        let mut escrow: Map<Address, i128> = env.storage().persistent().get(&USER_ESC).unwrap_or(Map::new(env));
        let current_balance = escrow.get(from.clone()).unwrap_or(0);

        if current_balance < amount {
            panic!("Insufficient funds in escrow");
        }

        // Update escrow balance
        escrow.set(from.clone(), current_balance - amount);
        env.storage().persistent().set(&USER_ESC, &escrow);

        // Transfer tokens from contract to developer
        let token_client = TokenClient::new(env, token);
        token_client.transfer(&env.current_contract_address(), to, &amount);
    }

    // View Functions

    // Get all tasks for a project
    pub fn get_project_tasks(env: Env, project_id: BytesN<32>) -> Vec<Task> {
        let project_tasks_map: Map<BytesN<32>, Vec<BytesN<32>>> =
            env.storage().persistent().get(&PROJ_TASK).unwrap_or(Map::new(&env));
        let task_ids = project_tasks_map.get(project_id).unwrap_or(Vec::new(&env));

        let tasks: Map<BytesN<32>, Task> = env.storage().persistent().get(&TASKS).unwrap_or(Map::new(&env));

        let mut result = Vec::new(&env);
        for task_id in task_ids.iter() {
            if let Some(task) = tasks.get(task_id.clone()) {
                result.push_back(task);
            }
        }

        result
    }

    // Get task details
    pub fn get_task(env: Env, task_id: BytesN<32>) -> Option<Task> {
        let tasks: Map<BytesN<32>, Task> = env.storage().persistent().get(&TASKS).unwrap_or(Map::new(&env));
        tasks.get(task_id)
    }

    // Get project details
    pub fn get_project(env: Env, project_id: BytesN<32>) -> Option<Project> {
        let projects: Map<BytesN<32>, Project> = env.storage().persistent().get(&PROJECTS).unwrap_or(Map::new(&env));
        projects.get(project_id)
    }
}