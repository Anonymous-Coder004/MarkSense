import subprocess
import sys

def install_dependencies():
    """Install Python dependencies for the Flask backend"""
    dependencies = [
        'Flask==2.3.3',
        'Flask-CORS==4.0.0',
        'Flask-JWT-Extended==4.5.2',
        'pymongo==4.5.0',
        'python-dotenv==1.0.0',
        'face-recognition==1.3.0',
        'Pillow==10.0.0'
    ]
    
    for package in dependencies:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
            print(f"✅ Successfully installed {package}")
        except subprocess.CalledProcessError:
            print(f"❌ Failed to install {package}")
            print("Please install manually using: pip install", package)

if __name__ == '__main__':
    install_dependencies()