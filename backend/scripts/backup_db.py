import os
import subprocess
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.environ.get("DATABASE_URL")
if not DB_URL:
    print("Error: DATABASE_URL not found in .env")
    exit(1)

backup_dir = "backups"
os.makedirs(backup_dir, exist_ok=True)

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
backup_file = os.path.join(backup_dir, f"hpms_backup_{timestamp}.sql")

print(f"Starting backup to {backup_file}...")
try:
    # Use pg_dump if installed. In production, consider pg_dump --clean
    subprocess.run(["pg_dump", DB_URL, "-f", backup_file], check=True)
    print("Backup completed successfully.")
except FileNotFoundError:
    print("Error: pg_dump not found. Please install PostgreSQL client tools.")
except subprocess.CalledProcessError as e:
    print(f"Error during backup: {e}")
