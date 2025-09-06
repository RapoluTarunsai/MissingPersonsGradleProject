import json
import sys
import cv2
import numpy as np
from deepface import DeepFace
import dlib
from scipy.spatial import distance

def numpy_to_python(obj):
    """Convert numpy types to Python native types"""
    if isinstance(obj, (np.int_, np.intc, np.intp, np.int8,
                        np.int16, np.int32, np.int64, np.uint8, np.uint16,
                        np.uint32, np.uint64)):
        return int(obj)
    elif isinstance(obj, (np.float_, np.float16, np.float32, np.float64)):
        return float(obj)
    elif isinstance(obj, (np.bool_)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj

def compare_faces(image_path1, image_path2):
    try:
        # Perform face comparison using FaceNet
        result = DeepFace.verify(
            img1_path=image_path1,
            img2_path=image_path2,
            model_name='Facenet',
            distance_metric='cosine',
            enforce_detection=True
        )

        # Convert numpy values to Python native types
        distance = numpy_to_python(result.get('distance', 1.0))
        similarity = numpy_to_python((1 - distance) * 100)
        is_match = numpy_to_python(result.get('verified', False))

        # Load images for additional analysis
        img1 = cv2.imread(image_path1)
        img2 = cv2.imread(image_path2)

        if img1 is None or img2 is None:
            raise Exception("Failed to load one or both images")

        # Analyze hair characteristics
        def analyze_hair(image):
            try:
                # Convert to HSV
                hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

                # Take upper third of image
                height = image.shape[0]
                top_region = hsv[0:int(height/3), :]

                # Calculate average brightness
                brightness = np.mean(top_region[:,:,2])

                # Determine hair characteristics
                is_dark = brightness < 128

                return {
                    "hair_color": "dark" if is_dark else "light",
                    "brightness_value": numpy_to_python(brightness),
                    "has_long_hair": numpy_to_python(brightness < 100)  # Simplified long hair detection
                }
            except Exception as e:
                return {
                    "error": f"Hair analysis failed: {str(e)}"
                }

        # Analyze both images
        hair_analysis1 = analyze_hair(img1)
        hair_analysis2 = analyze_hair(img2)

        # Compare hair characteristics
        hair_match = {
            "color_match": hair_analysis1["hair_color"] == hair_analysis2["hair_color"],
            "long_hair_match": hair_analysis1.get("has_long_hair") == hair_analysis2.get("has_long_hair")
        }

        response_data = {
            "success": True,
            "similarity_percentage": round(similarity, 2),
            "is_match": is_match,
            "details": {
                "model": "FaceNet",
                "distance": round(distance, 4),
                "hair_analysis": {
                    "image1": hair_analysis1,
                    "image2": hair_analysis2,
                    "comparison": hair_match
                }
            }
        }

        return json.dumps(response_data, indent=2)

    except Exception as e:
        error_message = str(e)
        print(f"Error in face comparison: {error_message}", file=sys.stderr)
        return json.dumps({
            "success": False,
            "error": error_message,
            "details": "Error processing images"
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
