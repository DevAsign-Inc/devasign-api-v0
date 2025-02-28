#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation},
    Address, BytesN, Env, IntoVal, Symbol, Vec,
};
use soroban_sdk::testutils::MockAuth;

use crate::{DevAsignContract, DevAsignContractClient, Project, Task, TaskStatus};

#[test]
fn test_create_project() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DevAsignContract);
    let client = DevAsignContractClient::new(&env, &contract_id);
    
    let manager = Address::generate(&env);
    let name = "Test Project".to_string();
    let repository_url = "https://github.com/test/project".to_string();
    
    // Authorize the call
    env.mock_all_auths();
    
    // Create project
    let project_id = client.create_project(&manager, &name, &repository_url);
    
    // Verify project was created correctly
    let project = client.get_project(&project_id).unwrap();
    assert_eq!(project.name, name);
    assert_eq!(project.manager, manager);
    assert_eq!(project.repository_url, repository_url);
    assert_eq!(project.total_tasks, 0);
}

#[test]
fn test_create_task() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DevAsignContract);
    let client = DevAsignContractClient::new(&env, &contract_id);
    
    let manager = Address::generate(&env);
    let token = Address::generate(&env);
    
    // Create a project first
    env.mock_all_auths();
    let project_id = client.create_project(
        &manager, 
        &"Test Project".to_string(), 
        &"https://github.com/test/project".to_string()
    );
    
    // Create a task
    let title = "Test Task".to_string();
    let description = "This is a test task".to_string();
    let compensation = 100_i128;
    
    let task_id = client.create_task(
        &project_id,
        &title,
        &description,
        &compensation,
        &manager,
        &token
    );
    
    // Verify task was created
    let task = client.get_task(&task_id).unwrap();
    assert_eq!(task.title, title);
    assert_eq!(task.description, description);
    assert_eq!(task.compensation, compensation);
    assert_eq!(task.project_id, project_id);
    assert_eq!(task.status, TaskStatus::Open);
    assert_eq!(task.assigned_developer, None);
    
    // Verify project task count was updated
    let project = client.get_project(&project_id).unwrap();
    assert_eq!(project.total_tasks, 1);
}

#[test]
fn test_developer_application_workflow() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DevAsignContract);
    let client = DevAsignContractClient::new(&env, &contract_id);
    
    let manager = Address::generate(&env);
    let developer = Address::generate(&env);
    let token = Address::generate(&env);
    
    // Create project and task
    env.mock_all_auths();
    let project_id = client.create_project(
        &manager, 
        &"Test Project".to_string(), 
        &"https://github.com/test/project".to_string()
    );
    
    let task_id = client.create_task(
        &project_id,
        &"Test Task".to_string(),
        &"This is a test task".to_string(),
        &100_i128,
        &manager,
        &token
    );
    
    // Developer applies for task
    let expected_completion = env.ledger().timestamp() + 86400 * 7; // 7 days
    client.apply_for_task(&task_id, &developer, &expected_completion);
    
    // Verify developer is in applicants list
    let task = client.get_task(&task_id).unwrap();
    let mut found = false;
    for applicant in task.applicants.iter() {
        if *applicant == developer {
            found = true;
            break;
        }
    }
    assert!(found, "Developer should be in the applicants list");
    
    // Manager approves application
    client.approve_application(&task_id, &developer, &manager);
    
    // Verify task is assigned to developer
    let task = client.get_task(&task_id).unwrap();
    assert_eq!(task.status, TaskStatus::Assigned);
    assert_eq!(task.assigned_developer, Some(developer.clone()));
    
    // Developer marks task as completed
    client.mark_task_completed(&task_id, &developer);
    
    // Verify task is marked as completed
    let task = client.get_task(&task_id).unwrap();
    assert_eq!(task.status, TaskStatus::Completed);
    
    // Manager approves completion
    client.approve_completion(&task_id, &manager, &token);
    
    // Verify task is approved
    let task = client.get_task(&task_id).unwrap();
    assert_eq!(task.status, TaskStatus::Approved);
}