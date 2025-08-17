Full flow api test :

All requests with JSON bodies must include header Content-Type: application/json.
Add header Authorization: Bearer <token> for protected routes.

1) Admin login (get token)

POST:- {{base}}/api/v1/auth/login

{ "email": "admin@ashmit.com", "password": "Ashmit@123" }
Save accessToken as admin_token in header Authorization like this:- Bearer <token>

2) Admin: create tester & developer

POST {{base}}/api/v1/auth/register
Headers: Authorization: Bearer {{admin_token}}
{ "email": "tester1@example.com", "password": "Tester@123", "role": "tester" }
{ "email": "dev1@example.com", "password": "Dev@123", "role": "developer" }
Save responses _id as tester_id and dev_id somewhere will require later.

3) Admin: create project (assign members at creation)

POST:- {{base}}/api/v1/projects
Headers: Authorization: Bearer {{admin_token}}

{
  "name": "Project Alpha1",
  "description": "Bug tracking system backend",
  "members": ["tester_id","dev_id"]
}

4) Admin: add/remove members later

PATCH :- {{base}}/api/v1/projects/{{project_id}}/members
Headers: Authorization: Bearer {{admin_token}}
{ "add": ["<userId>"], "remove": ["<userId>"] }


5) Tester login & check dashboard projects

POST:- {{base}}/api/v1/auth/login (tester creds) → save tester_token

GET:- {{base}}/api/v1/projects/my-projects
Headers: Authorization: Bearer {{tester_token/dev_token}}
Expected: project(s) where tester is in members.


6) Tester: create a bug in assigned project

POST {{base}}/api/v1/projects/{{project_id}}/bugs
Headers: Authorization: Bearer {{tester_token}}

{
  "title": "Login button not working",
  "description": "Click does nothing",
  "assignees": ["{{dev_id}}"]
}

Save returned _id as bug_id.
If you're gettin 403 You are not assigned to this project- make sure the tester is in members.

7) Developer login & update bug details/status

Login as developer → save dev_token.
GET:- {{base}}/api/v1/bugs/{{bug_id}}
Authorization: Bearer {{dev_token}}

Update bug fields (assignee/reassign or description) — allowed if reporter/assignee/admin:
PATCH {{base}}/api/v1/bugs/{{bug_id}}
{ "description": "Nul dcheck missing inpayment service" }

Change status (must include from and to):
PATCH {{base}}/api/v1/bugs/{{bug_id}}/status
Headers: Authorization: Bearer {{dev_token}}

{ "from": "open", "to": "solved", "note": "Fixed null pointer" }

Allowed transitions:

open → solved
solved → closed (only tester or admin can close)
solved → reopened
closed → reopened
reopened → solved
If developer tries to solved → closed they will get 403 (only tester/admin can close).

8) Tester verifies/close

Tester (or admin) can close:


9) Activities / Audit trail

GET {{base}}/api/v1/bugs/{{bug_id}}/activities
Headers: Authorization: Bearer {{any_token}}
Shows create/update/status_change/delete entries.

10) Delete bug/project/user
DELETE {{base}}/api/v1/bugs/{{bug_id}}
Authorization: Bearer {{admin_token}} or reporter

Delete project:
DELETE {{base}}/api/v1/projects/{{project_id}}
Authorization: Bearer {{admin_token}}

Delete user:
DELETE {{base}}/api/v1/users/{{user_id}}
Authorization: Bearer {{admin_token}}




