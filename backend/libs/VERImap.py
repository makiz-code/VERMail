import threading
import imaplib
import email
import json
from datetime import datetime
import torch
import warnings
from transformers import BertForSequenceClassification, BertTokenizer, pipeline, logging
from libs.MailKit import extract_email_data, delete_folder_contents

logging.get_logger("transformers").setLevel(logging.ERROR)
warnings.filterwarnings("ignore", message="errors='ignore' is deprecated.*")
warnings.filterwarnings("ignore", message="Downcasting behavior in `replace` is deprecated.*")
warnings.filterwarnings("ignore", message="`huggingface_hub` cache-system uses symlinks.*")

## Variables

device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')

model_path = "backend/data/models/VERModel.pth"
labels_path = "backend/data/models/labels.json"
recs_path = "backend/data/records"

with open(labels_path, "r") as f:
    labels  = json.load(f)

tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model = BertForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=len(labels)).to(device)
model.load_state_dict(torch.load(model_path))
qa = pipeline("question-answering", model="bert-large-uncased-whole-word-masking-finetuned-squad")

## IMAP Server

class MailBox:
    def __init__(self, username, passkey, sender_emails):
        self.username = username
        self.passkey = passkey
        self.sender_emails = sender_emails
        self.mail = None
    
    def connect(self):
        self.mail = imaplib.IMAP4_SSL("imap.gmail.com")
        try: 
            self.mail.login(self.username, self.passkey)
        except Exception as e: 
            raise Exception(f"Failed to connect to {self.username}: {str(e)}")

    def receive(self, repository, parsed_emails, nb_emails=1):
        if not self.mail:
            raise Exception("Action unauthorized: Please connect to the email account first")
        
        self.mail.select(repository)

        if len(self.sender_emails) > 1:
            search_query = 'UNSEEN (OR ' + ' '.join([f'(FROM "{sender}")' for sender in self.sender_emails]) + ')'
        else:
            search_query = f'UNSEEN FROM "{self.sender_emails[0]}"'

        result, data = self.mail.search(None, f'({search_query})')
        emails = self.get_emails(self.mail, result, data, nb_emails)

        if emails:
            for msg in emails:
                email_data = extract_email_data(msg)
                if email_data:
                    parsed_emails.append(email_data)

        parsed_emails.sort(key=lambda x: datetime.strptime(f"{x['datetime']}", "%m/%d/%Y %H:%M:%S"), reverse=True)
            
        return parsed_emails

    def get_emails(self, mail, result, data, nb_emails):
        emails = []
        if nb_emails:
            total_emails = min(nb_emails, len(data[0].split()))
        else:
            total_emails = len(data[0].split())
            
        if result == "OK":
            for num in data[0].split()[:total_emails]:
                result, raw_email = mail.fetch(num, "(RFC822)")
                if result == "OK":
                    msg = email.message_from_bytes(raw_email[0][1])
                    emails.append(msg)

        return emails

    def disconnect(self):
        if self.mail:
            self.mail.logout()
            self.mail = None

def parse_emails(email_list, passkey_list, sender_emails_list, repository_list):
    parsed_data = []
    threads = []

    def process_mailbox(email, passkey, sender_emails, repository, parsed_data):
        mailbox = MailBox(email, passkey, sender_emails)
        try:
            mailbox.connect()
            parsed_data_lock.acquire()
            parsed_data = mailbox.receive(repository, parsed_data)
        finally:
            parsed_data_lock.release()
            mailbox.disconnect()

    parsed_data_lock = threading.Lock()

    for i in range(len(email_list)):
        thread = threading.Thread(
            target=process_mailbox, 
            args=(email_list[i], passkey_list[i], sender_emails_list[i], repository_list[i], parsed_data)
        )
        threads.append(thread)
        thread.start()

    for thread in threads:
        thread.join()

    delete_folder_contents(recs_path)

    return parsed_data

## Email Classification

def get_probs(subject, body, labels=labels, model=model, tokenizer=tokenizer):
    inputs = tokenizer(subject, body, return_tensors='pt', truncation=True).to(device)  
    outputs = model(**inputs)
        
    probabilities = torch.sigmoid(outputs.logits).cpu().tolist()[0]
    rounded_probs = [round(prob, 3) for prob in probabilities]
    sorted_labels = sorted(zip(labels, rounded_probs), key=lambda x: x[1], reverse=True)
    
    return sorted_labels

def get_actions(probs, threshold=0.65, delta=0.05):
    final_actions = []
    max_prob = None
    
    for action, prob in probs:
        if prob <= threshold:
            break
        if max_prob is None:
            max_prob = prob
        if max_prob - prob <= delta:
            final_actions.append({'action': {'value': action, 'score': round(prob,3)}})
    
    return final_actions

def classify_emails(parsed_data):
    predicted_data = []
    for data in parsed_data:
        if 'intentions' in data:
            data.pop('intentions')
        probs = get_probs(data['subject'], data['body'])
        if probs:  
            actions = get_actions(probs)
            if actions:
                data['intentions'] = actions
            predicted_data.append(data)
        else:
            predicted_data.append(data)
    return predicted_data

## Information Extraction

def get_answer(query, context, threshold=0.5):
    result = qa(question=query, context=context)
    answer = None
    if threshold:
        if result['score'] > threshold:
            answer = result['answer']
    else:
        answer = result['answer']

    if answer:
        answer = answer.strip()
        score = round(result['score'], 3)
    else:
        answer = ""
        score = None
    return {'value': answer, 'score': score}

def get_context(data):
    files = []
    for attachment in data['attachments']:
        files.append(attachment['components'])
    body = {key: data[key] for key in ['subject', 'body']}
    body['attachments'] = files
    context = json.dumps(body)
    return context

def extract_fields(predicted_data, topic_fields):
    extracted_data = []
    for data in predicted_data:
        intents = []
        if 'intentions' in data:
            context = get_context(data)
            for intent in data['intentions']:
                json_data = {}
                queries = topic_fields[intent['action']['value']]
                for field, query in queries.items():
                    json_data[field] = get_answer(query, context)
                intent['fields'] = json_data
                intents.append(intent)
            data['intentions'] = intents
        extracted_data.append(data)
    return extracted_data

def define_state(extracted_data):
    final_data = []
    for data in extracted_data:
        if 'intentions' in data.keys():
            incomplete_flag = False
            for item in data['intentions']:
                for _, value in item['fields'].items():
                    if not value['value']:
                        data['state'] = {
                            'type': 'warning',
                            'category': 'Incomplete',
                        }
                        incomplete_flag = True
                        break
                if incomplete_flag:
                    break
            if not incomplete_flag:
                data['state'] = {
                    'type': 'success',
                    'category': 'Treated', 
                }
        else:
            data['state'] = {
                'type': 'danger',
                'category': 'Untreated',
            }
        final_data.append(data)
    return final_data

## MailBot Pipeline

def get_emails(params):
    # Parse emails
    parsed_data = parse_emails(
        params['email_list'],
        params['passkey_list'],
        params['sender_emails_list'],
        params['repository_list'],
    )

    # Classify parsed emails
    predicted_data = classify_emails(parsed_data)

    # Extract fields based on topics
    extracted_data = extract_fields(predicted_data, params['topic_fields'])

    # Define the final state
    final_data = define_state(extracted_data)
    return final_data
