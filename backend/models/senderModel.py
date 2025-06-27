from email_validator import validate_email, EmailNotValidError
import re

class Sender:
    def __init__(self, email, mailbox, company, state=True):
        self.mailbox = self.validate_email(mailbox)
        self.email = self.validate_email(email)
        self.company = self.validate_company(company)
        self.state = state

    def to_dict(self):
        return {
            'mailbox': self.mailbox,
            'email': self.email,
            'company': self.company,
            'state': self.state
        }

    @staticmethod
    def from_dict(data):
        return Sender(
            mailbox=data.get('mailbox', ''),
            email=data.get('email', ''),
            company=data.get('company', ''),
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
    def validate_company(company):
        if re.match(r'^[A-Za-z ]{0,30}$', company):
            return company
        else:
            raise Exception("company: Invalid company format")
        