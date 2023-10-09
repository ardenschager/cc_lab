import os
import json

image_directory = './downloaded_images'
images = [f for f in os.listdir(image_directory) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'))]

with open('image_list.json', 'w') as f:
    json.dump(images, f)