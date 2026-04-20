def test_register_user(client):
    response = client.post(
        "/register",
        json={
            "name": "Hari",
            "email": "hari@example.com",
            "password": "strongpass",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["message"] == "Registered successfully"
    assert payload["user"]["email"] == "hari@example.com"


def test_duplicate_registration_returns_400(client):
    client.post(
        "/register",
        json={
            "name": "Hari",
            "email": "hari@example.com",
            "password": "strongpass",
        },
    )

    response = client.post(
        "/register",
        json={
            "name": "Hari",
            "email": "hari@example.com",
            "password": "strongpass",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "User already exists"


def test_login_returns_token(client):
    client.post(
        "/register",
        json={
            "name": "Hari",
            "email": "hari@example.com",
            "password": "strongpass",
        },
    )

    response = client.post(
        "/login",
        json={
            "email": "hari@example.com",
            "password": "strongpass",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["access_token"]
    assert payload["token_type"] == "bearer"

