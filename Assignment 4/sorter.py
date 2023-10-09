import json

def load_json(file_name):
    with open(file_name, 'r') as f:
        data = json.load(f)
    return data

def save_json(data, file_name):
    with open(file_name, 'w') as f:
        json.dump(data, f, indent=4)

def sort_list(data):
    # Split each string into a number and its suffix (e.g., "123.jpg" becomes (123, ".jpg"))
    # Sort based on the number
    return sorted(data, key=lambda x: int(x.split('.')[0]))

def main():
    # Load the data
    data = load_json("image_list.json")

    # Sort the list
    sorted_data = sort_list(data)

    # Save the sorted list
    save_json(sorted_data, "sorted_output.json")

if __name__ == "__main__":
    main()
