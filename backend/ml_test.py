from attendance_ml import run_attendance_check

if __name__ == "__main__":
    run_attendance_check("tester@test.com") 



import cv2
import face_recognition
import numpy as np
import datetime
import dlib
import time
import requests
from keras.models import load_model
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from geopy.distance import geodesic

# ---------------------- MongoDB and Model Setup ---------------------- #
client = MongoClient("mongodb+srv://yash13sri:yash%401234@attendance-manager.wtbw2v0.mongodb.net/?retryWrites=true&w=majority&appName=attendance-manager",server_api=ServerApi('1'))
# Access your database (create one if it doesn't exist)
db = client["attendance_manager"]
try:
    client.admin.command('ping')
    print("[INFO] Successfully connected to MongoDB Atlas!")
except Exception as e:
    print("[ERROR] Could not connect to MongoDB Atlas:", e)
users_col = db["users"]
attendance_col = db["attendance_records"]
settings_col = db["admin_settings"]

# Load admin settings
admin_settings = settings_col.find_one()
office_coords = (admin_settings["office_location"]["lat"], admin_settings["office_location"]["lng"])
late_punch_time = admin_settings["late_punch_time"]

# Load models
mask_model = load_model(r"C:\Users\Yash\Downloads\project-bolt-sb1-bund41uj (2)\project\backend\models\mask_detector.h5")
predictor = dlib.shape_predictor(r"C:\Users\Yash\Downloads\project-bolt-sb1-bund41uj (2)\project\backend\models\shape_predictor_68_face_landmarks.dat")
detector = dlib.get_frontal_face_detector()


# ---------------------- Utility Functions ---------------------- #

def get_current_location():
    try:
        res = requests.get("https://ipinfo.io/json")
        loc = tuple(map(float, res.json()["loc"].split(",")))
        return loc
    except:
        return None


def is_near_office(user_coords):
    if user_coords is None:
        return False
    return geodesic(user_coords, office_coords).meters <= 200


def eye_aspect_ratio(eye):
    A = np.linalg.norm(eye[1] - eye[5])
    B = np.linalg.norm(eye[2] - eye[4])
    C = np.linalg.norm(eye[0] - eye[3])
    return (A + B) / (2.0 * C)


def is_blinking(shape):
    left_eye = np.array([(shape.part(i).x, shape.part(i).y) for i in range(36, 42)])
    right_eye = np.array([(shape.part(i).x, shape.part(i).y) for i in range(42, 48)])
    ear = (eye_aspect_ratio(left_eye) + eye_aspect_ratio(right_eye)) / 2.0
    return ear < 0.21


def is_masked(face_img):
    face_resized = cv2.resize(face_img, (224, 224))
    face_normalized = face_resized / 255.0
    prediction = mask_model.predict(np.expand_dims(face_normalized, axis=0))[0]
    return prediction[0] > prediction[1]  # [masked_prob, unmasked_prob]


def mark_attendance(user_id, name):
    now = datetime.datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    punch_time = now.strftime("%H:%M:%S")

    existing = attendance_col.find_one({"user_id": user_id, "date": today_str})
    if existing:
        if "punch_out" not in existing:
            attendance_col.update_one({"_id": existing["_id"]}, {"$set": {"punch_out": punch_time}})
            return "Punch-out marked."
        else:
            return "Already punched out today."
    else:
        is_late = now.time() > datetime.datetime.strptime(late_punch_time, "%H:%M").time()
        attendance_col.insert_one({
            "user_id": user_id,
            "name": name,
            "date": today_str,
            "punch_in": punch_time,
            "is_late": is_late
        })
        return "Punch-in marked."


# ---------------------- Main Function ---------------------- #
def run_attendance_check(email):
    user = users_col.find_one({"email": email})
    if not user or "face_encoding" not in user:
        print("User not found or no face encoding available.")
        return "Face data not registered."

    # Step 1: Location check before opening webcam
    user_location = get_current_location()
    if not is_near_office(user_location):
        print("User is not at the office location.")
        return "You are not at the office location."

    # Step 2: Prepare known data
    known_encoding = np.array(user["face_encoding"])
    known_id = str(user["_id"])
    known_name = user["name"]

    # Step 3: Open webcam
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    message = "Looking for a face..."
    blink_confirmed = False
    mask_checked = False

    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        locations = face_recognition.face_locations(rgb)
        encodings = face_recognition.face_encodings(rgb, locations)

        for (top, right, bottom, left), enc in zip(locations, encodings):
            match = face_recognition.compare_faces([known_encoding], enc, tolerance=0.45)[0]
            distance = face_recognition.face_distance([known_encoding], enc)[0]

            if match and distance < 0.45:
                face_img = frame[top:bottom, left:right]

                # Mask detection (only once at start)
                if not mask_checked:
                    if is_masked(face_img):
                        message = f"{known_name}, please remove mask!"
                        break
                    mask_checked = True

                # Blink detection
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = detector(gray)

                for face in faces:
                    shape = predictor(gray, face)
                    if is_blinking(shape):
                        blink_confirmed = True
                        break

                if blink_confirmed:
                    result = mark_attendance(known_id, known_name)
                    message = f"{result} Welcome, {known_name}!"
                    time.sleep(6)
                    cap.release()
                    cv2.destroyAllWindows()
                    return message
                else:
                    message = f"Welcome {known_name.upper()}! Please blink."

            else:
                message = "Face not recognized."

        # Display message on UI
        cv2.rectangle(frame, (0, frame.shape[0] - 40), (frame.shape[1], frame.shape[0]), (0, 0, 0), -1)
        cv2.putText(frame, message, (10, frame.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        cv2.imshow("Attendance System", frame)
        if cv2.waitKey(2) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    return message
