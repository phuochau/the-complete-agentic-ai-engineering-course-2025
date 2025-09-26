#!/usr/bin/env python3
"""
Hugging Face Spaces Deployment Script for NodeJS Chatbot
Usage: python deploy.py <your-hf-username> <space-name>
"""

import os
import sys
import shutil
import tempfile
import subprocess
from pathlib import Path

try:
    from huggingface_hub import HfApi, create_repo, upload_folder
    from huggingface_hub.utils import RepositoryNotFoundError
    HF_HUB_AVAILABLE = True
except ImportError:
    HF_HUB_AVAILABLE = False

def print_colored(text, color):
    colors = {
        'red': '\033[0;31m',
        'green': '\033[0;32m',
        'yellow': '\033[1;33m',
        'blue': '\033[0;34m',
        'nc': '\033[0m'
    }
    print(f"{colors.get(color, '')}{text}{colors['nc']}")

def check_requirements():
    """Check if all requirements are met"""
    if not HF_HUB_AVAILABLE:
        print_colored("❌ huggingface_hub is not installed", 'red')
        print_colored("Install with: pip install huggingface_hub", 'yellow')
        return False
    
    # Check if user is logged in
    try:
        api = HfApi()
        user = api.whoami()
        print_colored(f"✅ Logged in as: {user['name']}", 'green')
        return True
    except Exception:
        print_colored("❌ Not logged in to Hugging Face", 'red')
        print_colored("Run: huggingface-cli login", 'yellow')
        return False

def create_space(username, space_name):
    """Create a new Hugging Face Space"""
    try:
        api = HfApi()
        repo_id = f"{username}/{space_name}"
        
        print_colored(f"🚀 Creating Space: {repo_id}", 'blue')
        
        create_repo(
            repo_id=repo_id,
            repo_type="space",
            space_sdk="docker",
            private=False,
            exist_ok=True
        )
        
        print_colored(f"✅ Space created/verified: https://huggingface.co/spaces/{repo_id}", 'green')
        return repo_id
        
    except Exception as e:
        print_colored(f"❌ Failed to create Space: {e}", 'red')
        return None

def prepare_files():
    """Prepare files for deployment"""
    current_dir = Path.cwd()
    temp_dir = Path(tempfile.mkdtemp(prefix="hf-deploy-"))
    
    print_colored(f"📁 Preparing files in: {temp_dir}", 'blue')
    
    # Files and directories to exclude
    exclude_patterns = {
        'node_modules', '.git', '*.log', '__pycache__', 
        '.env', '.DS_Store', 'Thumbs.db'
    }
    
    # Copy all files except excluded ones
    for item in current_dir.iterdir():
        if item.name not in exclude_patterns and not item.name.startswith('.'):
            if item.is_dir():
                shutil.copytree(item, temp_dir / item.name, ignore=shutil.ignore_patterns(*exclude_patterns))
            else:
                shutil.copy2(item, temp_dir)
    
    # Copy important dot files
    important_files = ['.env.example', '.gitignore', '.dockerignore']
    for file in important_files:
        if (current_dir / file).exists():
            shutil.copy2(current_dir / file, temp_dir)
    
    return temp_dir

def deploy_to_space(repo_id, temp_dir):
    """Deploy files to Hugging Face Space"""
    try:
        print_colored("🚀 Uploading to Hugging Face Spaces...", 'blue')
        
        upload_folder(
            folder_path=str(temp_dir),
            repo_id=repo_id,
            repo_type="space",
            commit_message="Deploy Hau Vo AI Chatbot to Hugging Face Spaces\n\n- NodeJS TypeScript chatbot with OpenAI SDK Agents\n- Real-time chat interface with Socket.io\n- Beautiful Markdown formatting\n- Contact recording and question logging\n- Docker containerized for Hugging Face Spaces"
        )
        
        print_colored("🎉 Deployment successful!", 'green')
        return True
        
    except Exception as e:
        print_colored(f"❌ Deployment failed: {e}", 'red')
        return False

def main():
    if len(sys.argv) != 3:
        print_colored("Usage: python deploy.py <your-hf-username> <space-name>", 'red')
        print_colored("Example: python deploy.py hauvo hau-vo-chatbot", 'yellow')
        sys.exit(1)
    
    username = sys.argv[1]
    space_name = sys.argv[2]
    
    print_colored("🚀 Deploying Hau Vo Chatbot to Hugging Face Spaces", 'blue')
    print_colored(f"Space: https://huggingface.co/spaces/{username}/{space_name}", 'blue')
    print()
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Create space
    repo_id = create_space(username, space_name)
    if not repo_id:
        sys.exit(1)
    
    # Prepare files
    temp_dir = prepare_files()
    
    try:
        # Deploy
        if deploy_to_space(repo_id, temp_dir):
            print()
            print_colored("✅ Deployment complete!", 'green')
            print_colored(f"Your chatbot is being built at: https://huggingface.co/spaces/{repo_id}", 'green')
            print()
            print_colored("📋 Next steps:", 'blue')
            print("1. Go to your Space settings")
            print("2. Add your OPENAI_API_KEY as a secret")
            print("3. Wait for the build to complete")
            print("4. Your chatbot will be live! 🎉")
        else:
            sys.exit(1)
    
    finally:
        # Cleanup
        print_colored("🧹 Cleaning up temporary files...", 'blue')
        shutil.rmtree(temp_dir)

if __name__ == "__main__":
    main()
