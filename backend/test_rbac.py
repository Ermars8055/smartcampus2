import requests
r = requests.post("http://localhost:8007/api/auth/login", json={"username":"admin@eastpoint.edu","password":"password", "workspace":"eastpoint"})
if r.status_code == 200:
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    r_role = requests.get("http://localhost:8007/api/rbac/roles/11", headers=headers)
    print("GET Role:", r_role.status_code)
    if r_role.status_code == 200:
        role_data = r_role.json()
        print("Role Data Length:", len(str(role_data)))
        r_put = requests.put("http://localhost:8007/api/rbac/roles/11", headers=headers, json=role_data)
        print("PUT Role:", r_put.status_code)
        if r_put.status_code != 200:
            print("ERROR", r_put.json())
else:
    print("Login failed", r.status_code, r.text)
