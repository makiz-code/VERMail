import re

class Field:
    def __init__(self, topic, name, query, state=True):
        self.topic = self.validate_name(topic).title()
        self.name = self.validate_name(name).upper()
        self.query = self.validate_query(query).capitalize()
        self.state = state

    def to_dict(self):
        return {
            'topic': self.topic,
            'name': self.name,
            'query': self.query,
            'state': self.state
        }

    @staticmethod
    def from_dict(data):
        return Field(
            topic=data.get('topic', ''),
            name=data.get('name', ''),
            query=data.get('query', ''),
            state=data.get('state', True)
        )

    @staticmethod
    def validate_name(name):
        if re.match(r'^[A-Za-z ]{1,30}$', name):
            return name
        else:
            raise Exception("name: Invalid name format")
        
    @staticmethod
    def validate_query(query):
        if re.match(r'^.{30,256}\?$', query):
            return query
        else:
            raise Exception("query: Invalid query format")
    
        