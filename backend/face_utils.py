import face_recognition
import numpy as np
from PIL import Image
import io
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def detect_and_encode_face(image_file):
    """
    Detect face in uploaded image and extract face encoding
    
    Args:
        image_file: File object containing the uploaded image
        
    Returns:
        dict: Contains success status, face encoding, and any error messages
    """
    try:
        # Read image file
        image_data = image_file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Convert PIL image to numpy array
        image_array = np.array(image)
        
        # Find face locations in the image
        face_locations = face_recognition.face_locations(image_array)
        
        if len(face_locations) == 0:
            return {
                'success': False,
                'error': 'No face detected in the uploaded image. Please upload a clear face image.'
            }
        
        if len(face_locations) > 1:
            return {
                'success': False,
                'error': 'Multiple faces detected. Please upload an image with only one face.'
            }
        
        # Extract face encodings
        face_encodings = face_recognition.face_encodings(image_array, face_locations)
        
        if len(face_encodings) == 0:
            return {
                'success': False,
                'error': 'Could not extract face features. Please upload a clearer image.'
            }
        
        # Convert numpy array to list for MongoDB storage
        face_encoding_list = face_encodings[0].tolist()
        
        return {
            'success': True,
            'face_encoding': face_encoding_list,
            'face_location': face_locations[0]
        }
        
    except Exception as e:
        logger.error(f"Error processing face image: {str(e)}")
        return {
            'success': False,
            'error': f'Error processing image: {str(e)}'
        }

def compare_faces(known_encoding, unknown_encoding, tolerance=0.6):
    """
    Compare two face encodings to determine if they match
    
    Args:
        known_encoding: List of face encoding values from database
        unknown_encoding: List of face encoding values from new image
        tolerance: Face matching tolerance (lower = more strict)
        
    Returns:
        dict: Contains match result and confidence score
    """
    try:
        # Convert lists back to numpy arrays
        known_array = np.array(known_encoding)
        unknown_array = np.array(unknown_encoding)
        
        # Calculate face distance
        face_distance = face_recognition.face_distance([known_array], unknown_array)[0]
        
        # Determine if faces match
        is_match = face_distance <= tolerance
        
        # Calculate confidence (inverse of distance, normalized)
        confidence = max(0, (1 - face_distance) * 100)
        
        return {
            'success': True,
            'is_match': is_match,
            'confidence': round(confidence, 2),
            'distance': round(face_distance, 4)
        }
        
    except Exception as e:
        logger.error(f"Error comparing faces: {str(e)}")
        return {
            'success': False,
            'error': f'Error comparing faces: {str(e)}'
        }

def validate_face_image(image_file):
    """
    Validate uploaded image for face recognition requirements
    
    Args:
        image_file: File object containing the uploaded image
        
    Returns:
        dict: Contains validation result and any error messages
    """
    try:
        # Check file size (max 5MB)
        image_file.seek(0, 2)  # Seek to end
        file_size = image_file.tell()
        image_file.seek(0)  # Reset to beginning
        
        if file_size > 5 * 1024 * 1024:  # 5MB
            return {
                'success': False,
                'error': 'Image file size must be less than 5MB'
            }
        
        # Check if it's a valid image
        try:
            image = Image.open(image_file)
            image.verify()
            image_file.seek(0)  # Reset file pointer after verify
        except Exception:
            return {
                'success': False,
                'error': 'Invalid image file format'
            }
        
        # Check image dimensions (minimum requirements)
        image = Image.open(image_file)
        width, height = image.size
        image_file.seek(0)  # Reset file pointer
        
        if width < 200 or height < 200:
            return {
                'success': False,
                'error': 'Image dimensions must be at least 200x200 pixels'
            }
        
        return {
            'success': True,
            'message': 'Image validation passed'
        }
        
    except Exception as e:
        logger.error(f"Error validating image: {str(e)}")
        return {
            'success': False,
            'error': f'Error validating image: {str(e)}'
        }