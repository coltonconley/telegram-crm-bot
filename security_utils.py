from cryptography.fernet import Fernet
import os
import base64

class SessionEncryptor:
    def __init__(self, key=None):
        # Generate or use provided key
        if key:
            self.key = key
        else:
            self.key = os.environ.get('SESSION_ENCRYPTION_KEY') or Fernet.generate_key()
        self.cipher = Fernet(self.key)
    
    def encrypt_session(self, session_string):
        """Encrypt a session string"""
        if not session_string:
            return None
        encrypted = self.cipher.encrypt(session_string.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    
    def decrypt_session(self, encrypted_session):
        """Decrypt a session string"""
        if not encrypted_session:
            return None
        decoded = base64.urlsafe_b64decode(encrypted_session)
        return self.cipher.decrypt(decoded).decode() 