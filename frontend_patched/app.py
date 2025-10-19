from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
app = Flask(__name__)
# Apply CORS to the single app instance early so preflight responses include the
# Access-Control-Allow-Origin header.
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:8080", "http://127.0.0.1:8080"]}}, supports_credentials=True)

import sqlite3
import bcrypt
import random
from datetime import datetime
from pathlib import Path
from io import BytesIO
from barcode import EAN13
from barcode.writer import ImageWriter

# ---------- Utility ----------
def generate_application_code():
    base = datetime.utcnow().strftime("NHF-%Y%m%d-")
    suffix = "".join(random.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(6))
    return base + suffix

DB_PATH = Path(__file__).with_name("app.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ---------- Database ----------
def init_db():
    conn = get_db()
    cur = conn.cursor()

    # === USERS ===
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash BLOB NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('applicant', 'doctor', 'staff')),
        created_at TEXT NOT NULL
    )
    """)

    # === APPLICANTS ===
    cur.execute("""
    CREATE TABLE IF NOT EXISTS applicants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        full_name TEXT NOT NULL,
        trn TEXT UNIQUE NOT NULL,
        dob TEXT NOT NULL,
        gender TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        parish TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)

    # === DOCTORS ===
    cur.execute("""
    CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        full_name TEXT NOT NULL,
        mcj_reg_no TEXT UNIQUE NOT NULL,
        phone TEXT,
        parish TEXT,
        office_address TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)

    # === STAFF ===
    cur.execute("""
    CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash BLOB NOT NULL,
        dob TEXT NOT NULL,
        gender TEXT NOT NULL,
        trn TEXT UNIQUE NOT NULL,
        staff_id TEXT UNIQUE NOT NULL
    )
    """)

    # === APPLICATIONS (linked to user) ===
    cur.execute("""
    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        code TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        trn TEXT NOT NULL,
        dob TEXT NOT NULL,
        gender TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        parish TEXT,
        condition TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)

    # === CERTIFICATIONS ===
    cur.execute("""
    CREATE TABLE IF NOT EXISTS certifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_code TEXT NOT NULL,
        doctor_name TEXT NOT NULL,
        mcj_reg_no TEXT NOT NULL,
        office_address TEXT,
        parish TEXT,
        office_phone TEXT,
        conditions_json TEXT NOT NULL,
        notes TEXT,
        certification_date TEXT NOT NULL,
        FOREIGN KEY(app_code) REFERENCES applications(code)
    )
    """)

    # === APPROVALS ===
    cur.execute("""
    CREATE TABLE IF NOT EXISTS approvals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_code TEXT NOT NULL,
        status TEXT NOT NULL,
        reviewer_username TEXT,
        reviewed_at TEXT,
        reason TEXT
    )
    """)

    # === MEMBERS ===
    cur.execute("""
    CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_number TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        trn TEXT UNIQUE NOT NULL,
        valid_from TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()


# ---------- Flask setup ----------
# NOTE: init_db() used to be called on every request via before_request which
# caused extra work and could interfere with preflight handling. We initialize
# the DB at startup (below) and avoid returning early from before_request so
# the CORS extension can add the proper headers to OPTIONS responses.


# Fallback: ensure CORS headers are present on every response for /api/*
@app.after_request
def _add_cors_headers(response):
    try:
        # Only add for API routes
        if request.path.startswith("/api/"):
            response.headers.setdefault("Access-Control-Allow-Origin", "http://localhost:8080")
            response.headers.setdefault("Access-Control-Allow-Credentials", "true")
            response.headers.setdefault("Access-Control-Allow-Headers", "Content-Type,Authorization")
            response.headers.setdefault("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PUT,DELETE")
    except Exception:
        pass
    return response


# ---------- Helpers ----------
def json_row(row):
    return {k: row[k] for k in row.keys()}


def user_exists(username, email):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM users WHERE username=? OR email=?", (username, email))
    exists = cur.fetchone() is not None
    conn.close()
    return exists


# ---------- Registration ----------
@app.post("/api/applicants/register")
def register_applicant():
    data = request.get_json() or {}
    required = ["username", "email", "password", "full_name", "trn", "dob", "gender"]
    if not all(data.get(k) for k in required):
        return jsonify({"error": "Missing required applicant fields"}), 400

    if user_exists(data["username"], data["email"]):
        return jsonify({"error": "Account already exists with another role"}), 400

    pwd_hash = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt())

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, 'applicant', ?)",
                    (data["username"], data["email"], pwd_hash, datetime.utcnow().isoformat()))
        user_id = cur.lastrowid

        cur.execute("""INSERT INTO applicants (user_id, full_name, trn, dob, gender, address, phone, parish)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (user_id, data["full_name"], data["trn"], data["dob"], data["gender"],
                     data.get("address"), data.get("phone"), data.get("parish")))
        conn.commit()
        return jsonify({"ok": True, "role": "applicant"})
    except sqlite3.IntegrityError as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()

@app.post("/api/certifications")
def certify():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    app_code = data.get("app_code")
    doctor_name = data.get("doctor_name")
    notes = data.get("notes")
    conditions_json = data.get("conditions_json") or "[]"
    certification_date = data.get("certification_date") or datetime.utcnow().isoformat()

    if not app_code or not doctor_name:
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM certifications WHERE app_code=?", (app_code,))
    if cur.fetchone():
        conn.close()
        return jsonify({"error": "This application has already been certified"}), 403

    cur.execute(
        "INSERT INTO certifications (app_code, doctor_name, mcj_reg_no, office_address, parish, office_phone, conditions_json, notes, certification_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            app_code,
            doctor_name,
            data.get("mcj_reg_no") or "",
            data.get("office_address") or "",
            data.get("parish") or "",
            data.get("office_phone") or "",
            conditions_json,
            notes,
            certification_date,
        )
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Certification saved successfully"}), 201


@app.get("/api/doctor/applications/<code>")
def get_application_for_doctor(code):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM applications WHERE code=?", (code,))
    app_row = cur.fetchone()
    if not app_row:
        conn.close()
        return jsonify({"error": "Application not found"}), 404

    # Check if already certified
    cur.execute("SELECT 1 FROM certifications WHERE app_code=?", (code,))
    is_certified = cur.fetchone() is not None
    conn.close()

    app_data = dict(app_row)
    app_data["is_certified"] = is_certified
    return jsonify(app_data), 200


@app.post("/api/doctor/register")
def register_doctor():
    data = request.get_json() or {}
    required = ["username", "email", "password", "full_name", "mcj_reg_no"]
    if not all(data.get(k) for k in required):
        return jsonify({"error": "Missing required doctor fields"}), 400

    if user_exists(data["username"], data["email"]):
        return jsonify({"error": "Account already exists with another role"}), 400

    pwd_hash = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt())

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, 'doctor', ?)",
                    (data["username"], data["email"], pwd_hash, datetime.utcnow().isoformat()))
        user_id = cur.lastrowid
        cur.execute("""INSERT INTO doctors (user_id, full_name, mcj_reg_no, phone, parish, office_address)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (user_id, data["full_name"], data["mcj_reg_no"], data.get("phone"),
                     data.get("parish"), data.get("office_address")))
        conn.commit()
        return jsonify({"ok": True, "role": "doctor"})
    except sqlite3.IntegrityError as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


@app.post("/api/staff/register")
def register_staff():
    data = request.get_json() or {}
    required = ["username", "email", "password", "dob", "gender", "trn", "staff_id"]
    if not all(data.get(k) for k in required):
        return jsonify({"error": "Missing required staff registration fields"}), 400

    if user_exists(data["username"], data["email"]):
        return jsonify({"error": "Account already exists with another role"}), 400

    pwd_hash = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt())

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""INSERT INTO staff(username, email, password_hash, dob, gender, trn, staff_id)
                       VALUES(?,?,?,?,?,?,?)""",
                    (data["username"], data["email"], pwd_hash, data["dob"], data["gender"], data["trn"], data["staff_id"]))
        cur.execute("""INSERT INTO users(username, email, password_hash, role, created_at)
                       VALUES (?, ?, ?, 'staff', ?)""",
                    (data["username"], data["email"], pwd_hash, datetime.utcnow().isoformat()))
        conn.commit()
        return jsonify({"ok": True, "role": "staff"})
    except sqlite3.IntegrityError as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


# ---------- Login ----------
@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    user_input = data.get("username") or data.get("email")
    pwd = data.get("password", "")

    if not user_input or not pwd:
        return jsonify({"error": "Missing credentials"}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username=? OR email=?", (user_input, user_input))
    user_row = cur.fetchone()

    if not user_row or not bcrypt.checkpw(pwd.encode(), user_row["password_hash"]):
        conn.close()
        return jsonify({"error": "Invalid username or password"}), 401

    conn.close()
    return jsonify({
        "ok": True,
        "id": user_row["id"],
        "username": user_row["username"],
        "role": user_row["role"]
    })


# ---------- Applications ----------
@app.post("/api/applications")
def create_application():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    full_name = data.get("full_name")
    trn = data.get("trn")
    dob = data.get("dob")
    gender = data.get("gender")
    address = data.get("address")
    phone = data.get("phone")
    parish = data.get("parish")
    condition = data.get("condition")

    if not all([user_id, full_name, trn, dob, gender]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db()
    cur = conn.cursor()

    # Check if user already has application
    cur.execute("SELECT 1 FROM applications WHERE user_id=?", (user_id,))
    if cur.fetchone():
        conn.close()
        return jsonify({"error": "You already submitted an application"}), 403

    code = generate_application_code()
    created_at = datetime.utcnow().isoformat()

    try:
        cur.execute("""INSERT INTO applications(user_id, code, full_name, trn, dob, gender, address, phone, parish, condition, created_at)
                       VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
                    (user_id, code, full_name, trn, dob, gender, address, phone, parish, condition, created_at))
        cur.execute("""INSERT INTO approvals(app_code, status) VALUES(?, 'pending')""", (code,))
        conn.commit()
        return jsonify({"ok": True, "code": code})
    except sqlite3.IntegrityError as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 409
    finally:
        conn.close()


# ---------- Fetch existing application ----------
# ✅ for staff listing table
@app.get("/api/applications")
def get_applicant_applications():
    """List all applications submitted by the logged-in applicant (temp: all for now)."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT code, full_name, trn, dob, gender, address, phone, parish, condition, created_at
        FROM applications
        ORDER BY created_at DESC
    """)
    rows = cur.fetchall()
    conn.close()
    return jsonify({"applications": [dict(r) for r in rows]}), 200
# ✅ for staff “View Details” dialog
@app.get("/api/staff/applications/<code>")
def get_application_details(code):
    """Fetch full details for one application including certification and approval info."""
    conn = get_db()
    cur = conn.cursor()

    # Join applications, certifications, and approvals
    cur.execute("""
        SELECT 
            a.code,
            a.full_name,
            a.trn,
            a.dob,
            a.gender,
            a.address,
            a.phone,
            a.parish,
            a.condition,
            a.created_at,
            c.doctor_name,
            c.mcj_reg_no,
            c.office_address,
            c.parish AS doctor_parish,
            c.office_phone,
            c.conditions_json,
            c.notes,
            c.certification_date,
            ap.status AS approval_status,
            ap.reviewer_username,
            ap.reviewed_at,
            ap.reason
        FROM applications a
        LEFT JOIN certifications c ON a.code = c.app_code
        LEFT JOIN approvals ap ON a.code = ap.app_code
        WHERE a.code = ?
    """, (code,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Application not found"}), 404

    data = dict(row)

    # --- Split the response into sections for frontend ---
    application = {
        "code": data["code"],
        "full_name": data["full_name"],
        "trn": data["trn"],
        "dob": data["dob"],
        "gender": data["gender"],
        "address": data["address"],
        "phone": data["phone"],
        "parish": data["parish"],
        "condition": data["condition"],
        "created_at": data["created_at"],
    }

    certification = None
    if data.get("doctor_name"):
        certification = {
            "doctor_name": data["doctor_name"],
            "mcj_reg_no": data["mcj_reg_no"],
            "office_address": data["office_address"],
            "parish": data["doctor_parish"],
            "office_phone": data["office_phone"],
            "conditions_json": data["conditions_json"],
            "notes": data["notes"],
            "certification_date": data["certification_date"],
        }

    approval = {
        "status": data["approval_status"] or "pending",
        "reviewer_username": data["reviewer_username"],
        "reviewed_at": data["reviewed_at"],
        "reason": data["reason"],
    }

    return jsonify({
        "application": application,
        "certification": certification,
        "approval": approval
    }), 200

@app.get("/api/members/<trn>")
def get_member(trn):
    """Fetch a member record by TRN for the applicant portal."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM members WHERE trn = ?", (trn,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Member not found"}), 404

    # Convert row to dict for JSON response
    member = dict(row)
    return jsonify(member), 200


# ---------- Staff ----------
@app.post("/api/staff/approve")
def approve_application():
    data = request.get_json() or {}
    app_code = data.get("app_code")
    action = data.get("action")
    reviewer = data.get("reviewer_username", "staff")
    reason = data.get("reason")

    if action not in ("approved", "rejected") or not app_code:
        return jsonify({"error": "Invalid action"}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM applications WHERE code=?", (app_code,))
    app_row = cur.fetchone()
    if not app_row:
        conn.close()
        return jsonify({"error": "Application not found"}), 404

    cur.execute("""INSERT INTO approvals(app_code, status, reviewer_username, reviewed_at, reason)
                   VALUES(?,?,?,?,?)""",
                (app_code, action, reviewer, datetime.utcnow().isoformat(), reason))

    if action == "approved":
        nhf_number = "NHF" + "".join(random.choice("0123456789") for _ in range(9))
        cur.execute("SELECT 1 FROM members WHERE trn=?", (app_row["trn"],))
        if not cur.fetchone():
            cur.execute("""INSERT INTO members(member_number, full_name, trn, valid_from)
                           VALUES(?,?,?,?)""",
                        (nhf_number, app_row["full_name"], app_row["trn"], datetime.utcnow().date().isoformat()))

    conn.commit()
    conn.close()
    return jsonify({"ok": True})


# ---------- Run ----------
if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True) 