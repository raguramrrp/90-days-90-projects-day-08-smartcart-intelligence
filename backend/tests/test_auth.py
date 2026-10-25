import pytest

def test_user_registration(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@smartcart.ai",
            "username": "newuser",
            "password": "SecurePassword123!",
            "full_name": "New Tester",
            "preferred_currency": "INR"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "newuser@smartcart.ai"

def test_duplicate_email_registration_fails(client, test_user):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": test_user.email,
            "username": "different_username",
            "password": "SecurePassword123!"
        }
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_user_login_success(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "Password123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

def test_user_login_invalid_password(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "WrongPassword!"
        }
    )
    assert response.status_code == 401

def test_get_profile_authenticated(client, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "tester@smartcart.ai"

def test_get_profile_unauthorized(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
