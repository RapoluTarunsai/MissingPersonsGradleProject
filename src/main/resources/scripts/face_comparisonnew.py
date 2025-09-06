import json
import sys

import cv2
import numpy as np
import os
from deepface import DeepFace

def numpy_to_python(obj):
    if isinstance(obj, (np.int_, np.intc, np.intp, np.int8,
                        np.int16, np.int32, np.int64, np.uint8, np.uint16,
                        np.uint32, np.uint64)):
        return int(obj)
    elif isinstance(obj, (np.float_, np.float16, np.float32, np.float64)):
        return float(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj

def enhance_image(image):
    # Enhance image quality for better detection
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    cl = clahe.apply(l)
    enhanced = cv2.merge((cl,a,b))
    return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

def compare_faces(image_path1, image_path2):
    try:
        # Load images
        img1 = cv2.imread(image_path1)
        img2 = cv2.imread(image_path2)

        if img1 is None or img2 is None:
            raise Exception("Failed to load one or both images")

        # Enhance images
        img1 = enhance_image(img1)
        img2 = enhance_image(img2)

        # Save enhanced images temporarily
        cv2.imwrite('temp1.jpg', img1)
        cv2.imwrite('temp2.jpg', img2)

        # Extract faces from both images
        faces1 = DeepFace.extract_faces(
            img_path='temp1.jpg',
            detector_backend='retinaface'
        )

        faces2 = DeepFace.extract_faces(
            img_path='temp2.jpg',
            detector_backend='retinaface'
        )

        # Get face counts
        face_count1 = len(faces1)
        face_count2 = len(faces2)

        max_similarity = 0
        best_match_coords = None
        matched_face_image = None
        matched_full_image = None

        # Compare first image with each face from second image
        for face_data in faces2:
            face_coords = face_data['facial_area']

            # Extract face image
            face_img = img2[face_coords['y']:face_coords['y']+face_coords['h'],
                       face_coords['x']:face_coords['x']+face_coords['w']]

            # Extract full body image
            img_height, img_width = img2.shape[:2]
            body_height = int(face_coords['h'] * 3)
            y_start = max(0, face_coords['y'] - int(face_coords['h'] * 0.5))
            y_end = min(img_height, face_coords['y'] + body_height)
            x_start = max(0, face_coords['x'] - int(face_coords['w'] * 0.5))
            x_end = min(img_width, face_coords['x'] + face_coords['w'] * 2)

            full_img = img2[y_start:y_end, x_start:x_end]

            # Save temporary face image
            cv2.imwrite('temp_face.jpg', face_img)

            result = DeepFace.verify(
                img1_path='temp1.jpg',
                img2_path='temp_face.jpg',
                model_name='Facenet',
                distance_metric='cosine',
                enforce_detection=True,
                detector_backend='retinaface'
            )

            distance = numpy_to_python(result.get('distance', 1.0))
            current_similarity = numpy_to_python((1 - distance) * 100)

            if current_similarity > max_similarity:
                max_similarity = current_similarity
                best_match_coords = face_coords
                matched_face_image = face_img.copy()
                matched_full_image = full_img.copy()

        # Save matched face and full body images
        matched_face_path = None
        matched_full_path = None
        if matched_face_image is not None and max_similarity > 55:
            matched_face_path = 'matched_face.jpg'
            matched_full_path = 'matched_full.jpg'
            cv2.imwrite(matched_face_path, matched_face_image)
            cv2.imwrite(matched_full_path, matched_full_image)

        # Clean up temporary files
        os.remove('temp1.jpg')
        os.remove('temp2.jpg')
        os.remove('temp_face.jpg')

        response_data = {
            "success": True,
            "faces_in_image1": face_count1,
            "faces_in_image2": face_count2,
            "similarity_percentage": round(max_similarity, 2),
            "is_match": max_similarity > 60,
            "matched_face_coordinates": {
                "x": best_match_coords['x'],
                "y": best_match_coords['y'],
                "width": best_match_coords['w'],
                "height": best_match_coords['h']
            } if best_match_coords else None,
            "matched_face_path": matched_face_path,
            "matched_full_path": matched_full_path,
        }

        return json.dumps(response_data, indent=2)

    except Exception as e:
        error_message = str(e)
        print(f"Error in face comparison: {error_message}", file=sys.stderr)
        return json.dumps({
            "success": False,
            "error": error_message
        }, indent=2)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({
            "success": False,
            "error": "Two image paths are required"
        }, indent=2))
    else:
        result = compare_faces(sys.argv[1], sys.argv[2])
        print(result)
