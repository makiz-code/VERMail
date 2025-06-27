from email_validator import validate_email, EmailNotValidError
import re

class Mailbox:
    def __init__(self, email, passkey, repository, state=True):
        self.email = self.validate_email(email)
        self.passkey = self.validate_passkey(passkey)
        self.repository = self.validate_repository(repository)
        self.state = state

    def to_dict(self):
        return {
            'email': self.email,
            'passkey': self.passkey,
            'repository': self.repository,
            'state': self.state
        }

    @staticmethod
    def from_dict(data):
        return Mailbox(
            email=data.get('email', ''),
            passkey=data.get('passkey', ''),
            repository=data.get('repository', ''),
            state=data.get('state', True)
        )

    @staticmethod
    def validate_email(email):
        try:
            validate_email(email)
            return email
        except EmailNotValidError:
            raise Exception("email: Invalid email format")

    @staticmethod
    def validate_passkey(passkey):
        if re.match(r'^[a-z]{4} [a-z]{4} [a-z]{4} [a-z]{4}$', passkey):
            return passkey
        else:
            raise Exception("passkey: Invalid passkey format")
    
    @staticmethod
    def validate_repository(repository):
        if re.match(r'^[A-Za-z ]{1,30}$', repository):
            return repository
        else:
            raise Exception("repository: Invalid repository format")