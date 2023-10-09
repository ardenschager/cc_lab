import os
import requests

# Ensure the folder exists
folder_path = "downloaded_images"
if not os.path.exists(folder_path):
    os.makedirs(folder_path)

# Fetch data from the API
url = 'https://randomuser.me/api/?results=1000'  # Adjust the results parameter as needed
response = requests.get(url)
data = response.json()

# Download and save each image
for index, result in enumerate(data['results']):
    image_url = result['picture']['medium']  # Change to 'large' or 'thumbnail' if needed
    image_response = requests.get(image_url)
    if image_response.status_code == 200:
        with open(os.path.join(folder_path, f'image_{index}.jpg'), 'wb') as file:
            file.write(image_response.content)