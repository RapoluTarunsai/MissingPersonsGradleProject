import time

import cv2
import sys
import json
import os
from deepface import DeepFace

def detect_faces(image_path):
    try:
        # Read the image
        image = cv2.imread(image_path)

        if image is None:
            raise Exception("Failed to load image")

        # Resize image for faster processing while maintaining accuracy
        max_dimension = 800
        height, width = image.shape[:2]
        if max(height, width) > max_dimension:
            scale = max_dimension / max(height, width)
            image = cv2.resize(image, None, fx=scale, fy=scale)

        # Save image temporarily for DeepFace
        cv2.imwrite('temp.jpg', image, [cv2.IMWRITE_JPEG_QUALITY, 90])

        # Extract faces using DeepFace with optimized settings
        faces = DeepFace.extract_faces(
            img_path='temp.jpg',
            detector_backend='retinaface',
            align=False,
            enforce_detection=False
        )

        # Filter faces based on detection confidence
        human_faces = [face for face in faces if face.get('confidence', 0) > 0.99]


        # Clean up temporary file
        os.remove('temp.jpg')

        result = {
            "success": True,
            "faces_detected": len(human_faces),
        }

        return json.dumps(result)

    except Exception as e:
        return json.dumps({
            "success": False,
            "faces_detected": 0,
            "error": str(e)
        })

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({
            "success": False,
            "faces_detected": 0,
            "error": "Image path is required"
        }))
    else:
        result = detect_faces(sys.argv[1])
        print(result)
