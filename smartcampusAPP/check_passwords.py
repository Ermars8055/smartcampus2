import csv
import bcrypt

passwords_to_test = [b"Admin@123", b"Pass123@"]
matched_accounts = []

with open('users_hash.csv', 'r') as f:
    reader = csv.reader(f)
    for row in reader:
        if len(row) < 2:
            continue
        email = row[0]
        hashed = row[1].encode('utf-8')
        
        for p in passwords_to_test:
            try:
                if bcrypt.checkpw(p, hashed):
                    matched_accounts.append((email, p.decode('utf-8')))
            except Exception as e:
                pass

for account in matched_accounts:
    print(f"Match found! Email: {account[0]} | Password: {account[1]}")

if not matched_accounts:
    print("No matches found for those passwords.")
