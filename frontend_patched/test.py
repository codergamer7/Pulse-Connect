import bcrypt, sqlite3, datetime

conn = sqlite3.connect("app.db")
cur = conn.cursor()

# Create bcrypt hash for password 'root'
pwd_hash = bcrypt.hashpw(b"root", bcrypt.gensalt())

# Insert a doctor account
cur.execute("""
INSERT INTO users (username, email, password_hash, role, created_at)
VALUES (?, ?, ?, ?, ?)
""", (
    "arikofrench@gmail.com",  # username
    "arikofrench@gmail.com",  # email
    pwd_hash,                 # bcrypt hash
    "doctor",                 # role
    datetime.datetime.utcnow().isoformat()
))

conn.commit()
conn.close()

print("✅ Created test user 'arikofrench@gmail.com' with password 'root'")
