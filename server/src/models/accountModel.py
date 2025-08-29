import re

class Account:
    def __init__(self, username, password, role, state=True):
        self.username = self.validate_username(username)
        self.password = self.validate_password(password)
        self.role = self.validate_role(role)
        self.state = state

    def to_dict(self):
        return {
            'username': self.username,
            'password': self.password,
            'role': self.role,
            'state': self.state
        }

    @staticmethod
    def from_dict(data):
        return Account(
            username=data.get('username', ''),
            password=data.get('password', ''),
            role=data.get('role', ''),
            state=data.get('state', True)
        )

    @staticmethod
    def validate_username(username):
        if re.match(r'^[A-Za-z_]{1,30}$', username):
            return username
        else:
            raise Exception("username: Invalid username format")

    @staticmethod
    def validate_password(password):
        if re.match(r'^.{8,200}$', password):
            return password
        else:
            raise Exception("password: Invalid password format")
        
    @staticmethod
    def validate_role(role):
        valid_roles = ['TechAdmin', 'BusiAdmin', 'SysUser']
        if role in valid_roles:
            return role
        else:
            raise Exception("role: Invalid role format")

