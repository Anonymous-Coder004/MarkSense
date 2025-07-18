from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
import os
from functools import wraps
import json
from werkzeug.utils import secure_filename
from face_utils import detect_and_encode_face, validate_face_image
from pymongo.server_api import ServerApi
from bson import ObjectId
from face_utils import detect_and_encode_face
from attendance_ml import run_attendance_check
from flask import Response
import csv
import io
from bson.objectid import ObjectId
from datetime import datetime

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
def home():
    return "✅ Flask server is running. Backend is live!"

# Initialize extensions
jwt = JWTManager(app)

# MongoDB connection
client = MongoClient("mongodb+srv://yash13sri:yash%401234@attendance-manager.wtbw2v0.mongodb.net/?retryWrites=true&w=majority&appName=attendance-manager",server_api=ServerApi('1'))
# Access your database (create one if it doesn't exist)
db = client["attendance_manager"]
try:
    client.admin.command('ping')
    print("[INFO] Successfully connected to MongoDB Atlas!")
except Exception as e:
    print("[ERROR] Could not connect to MongoDB Atlas:", e)

# Collections
users = db.users
departments = db.departments
face_encodings = db.face_encodings
attendance_records = db.attendance_records
leave_requests = db.leave_requests
notifications = db.notifications
admin_settings = db.admin_settings

# Helper function
def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, dict):
                result[key] = serialize_doc(value)
            elif isinstance(value, list):
                result[key] = [serialize_doc(item) for item in value]
            else:
                result[key] = value
        return result
    return doc

def admin_required(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = get_jwt_identity()
        user = users.find_one({'_id': ObjectId(user_id)})
        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

# Initialize sample data
def init_sample_data():
    # Create sample departments
    if departments.count_documents({}) == 0:
        sample_departments = [
            {
                '_id': 'hr',
                'name': 'HR',
                'office_location': {'lat': 28.7041, 'lng': 77.1025}
            },
            {
                '_id': 'sales',
                'name': 'Sales',
                'office_location': {'lat': 28.7041, 'lng': 77.1025}
            },
            {
                '_id': 'finance',
                'name': 'Finance',
                'office_location': {'lat': 28.7041, 'lng': 77.1025}
            },
            {
                '_id': 'it',
                'name': 'IT',
                'office_location': {'lat': 28.7041, 'lng': 77.1025}
            },
            {
                '_id': 'operations',
                'name': 'Operations',
                'office_location': {'lat': 28.7041, 'lng': 77.1025}
            }
        ]
        departments.insert_many(sample_departments)

    # Create default admin settings
    if admin_settings.count_documents({}) == 0:
        default_settings = {
            '_id': ObjectId(),
            'late_punch_time': '10:00',
            'mandatory_working_hours': 8,
            'office_location': {'lat': 28.7041, 'lng': 77.1025},
            'failed_attempt_alert_threshold': 3
        }
        admin_settings.insert_one(default_settings)

    # Create sample admin user
    if users.count_documents({'role': 'admin'}) == 0:
        admin_user = {
            '_id': ObjectId(),
            'name': 'Admin User',
            'email': 'admin@company.com',
            'password': 'admin123',  # In production, hash this
            'role': 'admin',
            'status': 'active',
            'created_at': datetime.utcnow()
        }
        users.insert_one(admin_user)

# Authentication Routes

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    requested_role = data.get('role', 'employee')

    user = users.find_one({'email': email})
    if not user or user.get('password') != password:
        return jsonify({'error': 'Invalid credentials'}), 401

    # Validate role access if applicable
    if requested_role and user.get('role') and user.get('role') != requested_role:
        return jsonify({'error': f'Access denied. User is not authorized as {requested_role}'}), 403

    access_token = create_access_token(identity=str(user['_id']))

    # Get department info
    if user.get('department_id'):
        department = departments.find_one({'_id': user['department_id']})
        if department:
            user['department'] = serialize_doc(department)

    return jsonify({
        'token': access_token,
        'user': serialize_doc(user)
    })

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        gender = request.form.get('gender')
        department_id = request.form.get('department_id')
        face_image = request.files.get('face_image')
    
        # Basic validation
        if not all([name, email, password, gender, department_id, face_image]):
            print("prob1")
            return jsonify({"success": False, "error": "Missing required fields"}), 400

        # Check for existing user
        if users.find_one({"email": email}):
            print("prob2")
            return jsonify({"success": False, "error": "Email already registered"}), 400

        # Validate and encode face
        result = detect_and_encode_face(face_image)
        print("DEBUG FACE DETECTION RESULT:", result)
        if not result["success"]:
            print("prob3")
            return jsonify({"success": False, "error": result["error"]}), 400

        face_encoding = result["face_encoding"]

        # Hash the password
        hashed_password = password

        # Save to MongoDB
        user_data = {
            "name": name,
            "email": email,
            "password": hashed_password,
            "gender": gender,
            "role": "employee",
            "created_at": datetime.utcnow(),
            "department_id": department_id,
            "face_encoding": face_encoding,
        }
        users.insert_one(user_data)

        return jsonify({"success": True, "message": "User registered successfully"}), 201

    except Exception as e:
        print("Registration error:", e)
        return jsonify({"success": False, "error": "Registration failed. Please try again."}), 500
    

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = users.find_one({"_id": ObjectId(user_id)})

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Optionally fetch department
    if user.get('department_id'):
        department = departments.find_one({'_id': user['department_id']})
        if department:
            user['department'] = serialize_doc(department)

    return jsonify({"user": serialize_doc(user)}), 200

#appendance-info
@app.route('/api/attendance/mark', methods=['POST'])
@jwt_required()
def mark_attendance():
    user_id = get_jwt_identity()
    data = request.get_json()
    location = data.get('location')

    user = users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Run ML-based attendance validation
    try:
        result = run_attendance_check(user['email'])
        if result["status"] != "success":
            return jsonify({'error': result["message"]}), 403
    except Exception as e:
        return jsonify({'error': f'Face verification failed: {str(e)}'}), 403

    today = datetime.utcnow().date()
    existing_record = attendance_records.find_one({
        'user_id': ObjectId(user_id),
        'date': today.isoformat()
    })

    if existing_record and existing_record.get('punch_in'):
        return jsonify({'error': 'Attendance already marked today'}), 400

    record_data = {
        'user_id': ObjectId(user_id),
        'date': today.isoformat(),
        'punch_in': {
            'time': datetime.utcnow(),
            'location': location
        },
        'is_late': result.get('is_late', False),
        'status': 'present'
    }

    if existing_record:
        attendance_records.update_one(
            {'_id': existing_record['_id']},
            {'$set': record_data}
        )
    else:
        attendance_records.insert_one(record_data)

    return jsonify({
        'message': result["message"],
        'record': serialize_doc(record_data)
    })

@app.route('/api/attendance/punch-out', methods=['POST'])
@jwt_required()
def punch_out():

    user_id = get_jwt_identity()
    user = users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    result = run_attendance_check(user["email"])
    if result["status"] != "success":
        return jsonify({'error': result["message"]}), 403

    today = datetime.utcnow().date()

    record = attendance_records.find_one({
        'user_id': ObjectId(user_id),
        'date': today.isoformat()
    })

    if not record or not record.get('punch_in'):
        return jsonify({'error': 'No punch-in record found for today'}), 400

    if record.get('punch_out'):
        return jsonify({'error': 'Already punched out today'}), 400

    punch_in_time = record['punch_in']['time']
    punch_out_time = datetime.utcnow()
    working_hours = (punch_out_time - punch_in_time).total_seconds() / 3600

    # Fetch mandatory hours
    settings = admin_settings.find_one() or {}
    mandatory_hours = float(settings.get("mandatory_working_hours", 8))

    attendance_records.update_one(
        {'_id': record['_id']},
        {'$set': {
            'punch_out': {
                'time': punch_out_time,
                'location': record['punch_in']['location']  # fallback to same loc
            },
            'working_hours': round(working_hours, 2),
            'overtime_hours': max(0, working_hours - mandatory_hours)
        }}
    )

    return jsonify({'message': 'Punched out successfully'})


@app.route('/api/attendance/today', methods=['GET'])
@jwt_required()
def get_today_attendance():
    user_id = get_jwt_identity()
    today = datetime.utcnow().date()
    
    record = attendance_records.find_one({
        'user_id': ObjectId(user_id),
        'date': today.isoformat()
    })
    
    return jsonify(serialize_doc(record))

@app.route('/api/attendance/history', methods=['GET'])
@jwt_required()
def get_attendance_history():
    user_id = get_jwt_identity()
    period = request.args.get('period', 'week')
    page = int(request.args.get('page', 1))
    
    # Calculate date range based on period
    end_date = datetime.utcnow().date()
    if period == 'week':
        start_date = end_date - timedelta(days=7)
    elif period == 'month':
        start_date = end_date - timedelta(days=30)
    else:  # year
        start_date = end_date - timedelta(days=365)
    
    records = list(attendance_records.find({
        'user_id': ObjectId(user_id),
        'date': {'$gte': start_date.isoformat(), '$lte': end_date.isoformat()}
    }).sort('date', -1).skip((page - 1) * 20).limit(20))
    
    return jsonify({'records': serialize_doc(records)})

@app.route('/api/attendance/stats', methods=['GET'])
@jwt_required()
def get_attendance_stats():
    user_id = get_jwt_identity()
    
    # Calculate stats for the current month
    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    records = list(attendance_records.find({
        'user_id': ObjectId(user_id),
        'date': {'$gte': start_of_month.date().isoformat()}
    }))
    
    present_days = len([r for r in records if r.get('status') == 'present'])
    late_days = len([r for r in records if r.get('is_late')])
    overtime_hours = sum([r.get('overtime_hours', 0) for r in records])
    
    total_working_days = len(records)
    attendance_rate = (present_days / total_working_days * 100) if total_working_days > 0 else 0
    
    return jsonify({
        'present_days': present_days,
        'late_days': late_days,
        'overtime_hours': overtime_hours,
        'attendance_rate': round(attendance_rate, 1)
    })

# Leave Routes
@app.route('/api/leaves', methods=['POST'])
@jwt_required()
def submit_leave_request():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    leave_data = {
        '_id': ObjectId(),
        'user_id': ObjectId(user_id),
        'from_date': data['from_date'],
        'to_date': data['to_date'],
        'reason': data['reason'],
        'status': 'pending',
        'created_at': datetime.utcnow()
    }
    
    leave_requests.insert_one(leave_data)
    
    return jsonify({'message': 'Leave request submitted successfully'})

@app.route('/api/leaves', methods=['GET'])
@jwt_required()
def get_leave_requests():
    user_id = get_jwt_identity()
    user = users.find_one({'_id': ObjectId(user_id)})
    
    if user['role'] == 'admin':
        # Admin can see all leave requests
        status = request.args.get('status')
        query = {}
        if status:
            query['status'] = status
        
        leaves = list(leave_requests.find(query).sort('created_at', -1))
        
        # Populate user info
        for leave in leaves:
            user_info = users.find_one({'_id': leave['user_id']})
            if user_info:
                # Get department info
                if user_info.get('department_id'):
                    department = departments.find_one({'_id': user_info['department_id']})
                    user_info['department'] = serialize_doc(department)
                leave['user'] = serialize_doc(user_info)
        
        return jsonify(serialize_doc(leaves))
    else:
        # Employee can only see their own requests
        leaves = list(leave_requests.find({'user_id': ObjectId(user_id)}).sort('created_at', -1))
        return jsonify(serialize_doc(leaves))

@app.route('/api/leaves/<leave_id>/approve', methods=['PATCH'])
@admin_required
def approve_leave(leave_id):
    leave_requests.update_one(
        {'_id': ObjectId(leave_id)},
        {'$set': {'status': 'approved'}}
    )
    return jsonify({'message': 'Leave request approved'})

@app.route('/api/leaves/<leave_id>/reject', methods=['PATCH'])
@admin_required
def reject_leave(leave_id):
    leave_requests.update_one(
        {'_id': ObjectId(leave_id)},
        {'$set': {'status': 'rejected'}}
    )
    return jsonify({'message': 'Leave request rejected'})

@app.route('/api/auth/google', methods=['POST'])
def google_login():
    data = request.get_json()
    credential = data.get('credential')
    requested_role = data.get('role', 'employee')
    
    if not credential:
        return jsonify({'error': 'Google credential is required'}), 400
    
    try:
        # Decode the JWT token from Google
        # In production, verify the token with Google's public keys
        decoded_token = pyjwt.decode(credential, options={"verify_signature": False})
        
        google_id = decoded_token.get('sub')
        email = decoded_token.get('email')
        name = decoded_token.get('name')
        picture = decoded_token.get('picture')
        
        if not email or not google_id:
            return jsonify({'error': 'Invalid Google token'}), 400
        
        # Check if user exists
        user = users.find_one({'$or': [{'email': email}, {'google_id': google_id}]})
        
        if user:
            # Existing user - validate role
            if user.get('role') != requested_role:
                return jsonify({'error': f'Access denied. User is not authorized as {requested_role}'}), 403
            
            # Update Google ID if not set
            if not user.get('google_id'):
                users.update_one(
                    {'_id': user['_id']},
                    {'$set': {'google_id': google_id, 'photo_url': picture}}
                )
                user['google_id'] = google_id
                user['photo_url'] = picture
        else:
            # New user - create account
            if requested_role == 'admin':
                # For admin, you might want additional verification
                return jsonify({'error': 'Admin accounts must be created manually'}), 403
            
            user_data = {
                '_id': ObjectId(),
                'name': name,
                'email': email,
                'google_id': google_id,
                'role': 'employee',
                'photo_url': picture,
                'status': 'active',
                'created_at': datetime.utcnow()
            }
            
            users.insert_one(user_data)
            user = user_data
        
        # Generate access token
        access_token = create_access_token(identity=str(user['_id']))
        
        # Get department info
        if user.get('department_id'):
            department = departments.find_one({'_id': user['department_id']})
            user['department'] = serialize_doc(department)
        
        return jsonify({
            'token': access_token,
            'user': serialize_doc(user)
        })
        
    except Exception as e:
        print(f"Google login error: {str(e)}")
        return jsonify({'error': 'Failed to process Google login'}), 500

# Admin Routes
@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def get_admin_stats():
    today = datetime.utcnow().date()
    
    # Get total employees
    total_employees = users.count_documents({'role': 'employee'})
    
    # Get today's attendance stats
    today_records = list(attendance_records.find({'date': today.isoformat()}))
    present_today = len([r for r in today_records if r.get('status') == 'present'])
    late_today = len([r for r in today_records if r.get('is_late')])
    absent_today = total_employees - present_today
    
    # Get overtime hours
    overtime_hours = sum([r.get('overtime_hours', 0) for r in today_records])
    
    # Generate sample weekly data (in production, this would be real data)
    weekly_attendance = [45, 48, 50, 47, 46, 20, 15]  # Sample data
    weekly_late = [5, 3, 2, 4, 6, 2, 1]  # Sample data
    
    return jsonify({
        'total_employees': total_employees,
        'present_today': present_today,
        'late_today': late_today,
        'absent_today': absent_today,
        'overtime_hours': overtime_hours,
        'weekly_attendance': weekly_attendance,
        'weekly_late': weekly_late
    })

@app.route('/api/admin/employees', methods=['GET'])
@admin_required
def get_employees():
    employee_list = list(users.find({'role': 'employee'}))
    
    # Populate department info
    for employee in employee_list:
        if employee.get('department_id'):
            department = departments.find_one({'_id': employee['department_id']})
            employee['department'] = serialize_doc(department)
    
    return jsonify(serialize_doc(employee_list))

@app.route('/api/admin/employees/<employee_id>', methods=['PATCH'])
@admin_required
def update_employee_status(employee_id):
    data = request.get_json()
    status = data.get('status')
    
    users.update_one(
        {'_id': ObjectId(employee_id)},
        {'$set': {'status': status}}
    )
    
    return jsonify({'message': f'Employee {status} successfully'})

@app.route('/api/admin/settings', methods=['GET'])
@admin_required
def get_admin_settings():
    settings = admin_settings.find_one()
    if not settings:
        # Return default settings if none exist
        settings = {
            'late_punch_time': '10:00',
            'mandatory_working_hours': 8,
            'office_location': {'lat': 28.7041, 'lng': 77.1025},
            'failed_attempt_alert_threshold': 3
        }
    
    return jsonify(serialize_doc(settings))

@app.route('/api/admin/settings', methods=['PATCH'])
@admin_required
def update_admin_settings():
    data = request.get_json()
    
    admin_settings.update_one(
        {},
        {'$set': data},
        upsert=True
    )
    
    return jsonify({'message': 'Settings updated successfully'})
@app.route('/api/admin/reports', methods=['GET'])
@admin_required
def generate_report():
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')
    format_type = request.args.get('format', 'json')
    department_id = request.args.get('department_id')

    # Step 1: Filter users by department (if provided)
    user_query = {}
    if department_id:
        user_query['department_id'] = ObjectId(department_id)

    users_in_dept = list(users.find(user_query, {'_id': 1, 'name': 1, 'email': 1}))
    user_ids = [user['_id'] for user in users_in_dept]
    user_map = {str(user['_id']): user for user in users_in_dept}

    # Step 2: Filter attendance records for these users
    attendance_query = {
        'user_id': {'$in': user_ids}
    }
    if from_date:
        attendance_query['date'] = {'$gte': from_date}
    if to_date:
        attendance_query.setdefault('date', {}).update({'$lte': to_date})

    records = list(attendance_records.find(attendance_query))

    if format_type == 'csv':
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            'Date', 'Employee Name', 'Email',
            'Punch In', 'Punch Out',
            'Working Hours', 'Overtime Hours', 'Status'
        ])

        for record in records:
            uid = str(record['user_id'])
            user = user_map.get(uid, {})
            writer.writerow([
                record.get('date', ''),
                user.get('name', 'N/A'),
                user.get('email', 'N/A'),
                record.get('punch_in', {}).get('time', '--'),
                record.get('punch_out', {}).get('time', '--'),
                record.get('working_hours', 0),
                record.get('overtime_hours', 0),
                record.get('status', '')
            ])

        response = Response(output.getvalue(), mimetype='text/csv')
        response.headers["Content-Disposition"] = "attachment; filename=attendance_report.csv"
        return response

    else:
        return jsonify({
            'report_type': 'attendance',
            'department_id': department_id,
            'from_date': from_date,
            'to_date': to_date,
            'generated_at': datetime.utcnow().isoformat(),
            'records': records
        })

@app.route('/api/admin/departments', methods=['GET'])
def get_departments():
    dept_list = list(departments.find())
    return jsonify(serialize_doc(dept_list))

if __name__ == '__main__':
    init_sample_data()
    app.run(debug=True, host='0.0.0.0', port=5000)