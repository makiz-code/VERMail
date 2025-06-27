import re

class Topic:
    def __init__(self, name, desc, state=True):
        self.name = self.validate_name(name).title()
        self.desc = self.validate_desc(desc).capitalize()
        self.state = state

    def to_dict(self):
        return {
            'name': self.name,
            'desc': self.desc,
            'state': self.state
        }

    @staticmethod
    def from_dict(data):
        return Topic(
            name=data.get('name', ''),
            desc=data.get('desc', ''),
            state=data.get('state', True)
        )

    @staticmethod
    def validate_name(name):
        if re.match(r'^[A-Za-z ]{1,30}$', name):
            return name
        else:
            raise Exception("name: Invalid name format")
        
    @staticmethod
    def validate_desc(desc):
        if re.match(r'^.{50,256}$', desc):
            return desc
        else:
            raise Exception("desc: Invalid desc format")
    