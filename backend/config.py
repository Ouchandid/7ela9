import os
from urllib.parse import urlparse, urlunparse

# --- Database Configuration Class ---
# This class handles dynamic configuration based on environment variables.
class Config:
    # 1. Look for the environment variable 'DATABASE_URL'.
    # This is the standard name used by Render, Heroku, etc.
    # If not found, fall back to a local URL (e.g., your existing MySQL setup or a local Postgres).
    # NOTE: The provided app.py snippet uses a MySQL config, so we'll default to a generic MySQL URI 
    # to maintain local compatibility if the env var isn't set, but instruct the user to set it.
    DATABASE_URL = os.environ.get(
        'DATABASE_URL',
        'mysql+pymysql://root:@localhost:3307/myhair' # Fallback for local development
    )
    
    # 2. SQLAlchemy specific settings
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 3. Dynamic URI Generation (The Core Logic)
    # The connection URI from Render (and many providers) for PostgreSQL often uses 
    # the scheme 'postgres://' or 'postgresql://'.
    # Older versions of SQLAlchemy require the scheme 'postgresql+psycopg2://' or similar.
    # To ensure compatibility, we automatically convert 'postgres://' to 'postgresql://'.
    
    if DATABASE_URL.startswith('postgres://'):
        # Parse the URL
        url = urlparse(DATABASE_URL)
        
        # Check if the scheme needs conversion (Render often provides 'postgres')
        if url.scheme == 'postgres':
            # Reconstruct the URL using 'postgresql' scheme, which is standard for SQLAlchemy
            # Note: We append '+psycopg2' explicitly here to recommend the driver often needed in deployment.
            SQLALCHEMY_DATABASE_URI = urlunparse(url._replace(scheme='postgresql+psycopg2'))
        else:
            SQLALCHEMY_DATABASE_URI = DATABASE_URL
            
    elif DATABASE_URL.startswith('postgresql://'):
         # If it's already 'postgresql://', use it directly or adjust the driver if needed
         SQLALCHEMY_DATABASE_URI = DATABASE_URL.replace('postgresql://', 'postgresql+psycopg2://', 1)

    else:
        # For other databases like MySQL (local fallback)
        SQLALCHEMY_DATABASE_URI = DATABASE_URL

    # --- AWS S3 Configuration ---
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    AWS_REGION = os.environ.get('AWS_REGION', 'eu-north-1') # Default fallback
    BUCKET_NAME = os.environ.get('BUCKET_NAME')


# You can define a separate config for production if you want
class DevelopmentConfig(Config):
    DEBUG = True
    # If using your existing MySQL configuration for local dev, you'd override it here:
    # SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:@localhost:3307/myhair'

# A helper dictionary to choose the config based on FLASK_ENV
config_by_name = {
    'development': DevelopmentConfig,
    'testing': Config,
    'production': Config
}

# Simple function to load the configuration
def load_config(env_name='development'):
    """Loads the correct configuration class based on environment name."""
    return config_by_name.get(env_name, Config)