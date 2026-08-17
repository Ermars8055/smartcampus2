import sys

def main():
    file_path = '/Users/admin/Desktop/new_app_smart/database/nissigrid_stores_dump.sql'
    with open(file_path, 'r') as f:
        content = f.read()

    # Replace the remaining instances
    new_content = content.replace('OWNER TO postgres', 'OWNER TO nissigrid')

    with open(file_path, 'w') as f:
        f.write(new_content)

    print("Replacement complete.")

if __name__ == '__main__':
    main()
