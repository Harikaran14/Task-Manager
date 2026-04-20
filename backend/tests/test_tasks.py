def test_create_and_fetch_task(client, auth_headers):
    create_response = client.post(
        "/tasks",
        json={"title": "Build API", "description": "Port MERN backend to FastAPI"},
        headers=auth_headers,
    )

    assert create_response.status_code == 201
    task = create_response.json()
    assert task["title"] == "Build API"
    assert task["completed"] is False

    get_response = client.get(f"/tasks/{task['id']}", headers=auth_headers)
    assert get_response.status_code == 200
    assert get_response.json()["id"] == task["id"]


def test_task_pagination_and_filtering(client, auth_headers):
    for index in range(12):
        client.post(
            "/tasks",
            json={"title": f"Task {index}", "description": ""},
            headers=auth_headers,
        )

    client.put("/tasks/1", json={"completed": True}, headers=auth_headers)
    client.put("/tasks/2", json={"completed": True}, headers=auth_headers)

    first_page = client.get("/tasks?page=1&page_size=5", headers=auth_headers)
    completed_only = client.get("/tasks?completed=true", headers=auth_headers)

    assert first_page.status_code == 200
    assert len(first_page.json()["items"]) == 5
    assert first_page.json()["total"] == 12
    assert first_page.json()["total_pages"] == 3

    assert completed_only.status_code == 200
    assert completed_only.json()["total"] == 2
    assert all(item["completed"] is True for item in completed_only.json()["items"])


def test_user_cannot_access_other_users_task(client, auth_headers):
    task_response = client.post(
        "/tasks",
        json={"title": "Private task", "description": "Only mine"},
        headers=auth_headers,
    )
    task_id = task_response.json()["id"]

    client.post(
        "/register",
        json={
            "name": "Another User",
            "email": "other@example.com",
            "password": "strongpass",
        },
    )
    login_response = client.post(
        "/login",
        json={"email": "other@example.com", "password": "strongpass"},
    )
    other_headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}

    response = client.get(f"/tasks/{task_id}", headers=other_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"


def test_delete_task(client, auth_headers):
    create_response = client.post(
        "/tasks",
        json={"title": "Delete me", "description": "Temporary task"},
        headers=auth_headers,
    )
    task_id = create_response.json()["id"]

    delete_response = client.delete(f"/tasks/{task_id}", headers=auth_headers)
    assert delete_response.status_code == 200
    assert delete_response.json()["message"] == "Deleted successfully"

    missing_response = client.get(f"/tasks/{task_id}", headers=auth_headers)
    assert missing_response.status_code == 404

