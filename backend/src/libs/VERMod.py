import pandas as pd
import json
import os
import torch
import warnings
from tqdm import tqdm
from transformers import AutoModelForSequenceClassification, AutoTokenizer, logging
from sklearn.metrics import precision_recall_fscore_support
from sklearn.model_selection import train_test_split
from torch.utils.data import Dataset, DataLoader
from config.envs import LLM_MODEL

logging.get_logger("transformers").setLevel(logging.ERROR)
warnings.filterwarnings("ignore", category=UserWarning, module=r"transformers.*")
warnings.filterwarnings("ignore", category=FutureWarning, module=r"huggingface_hub.*")

## Variables

device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')

model_path = "backend/src/data/models/VERModel.pth"
metrics_path = "backend/src/data/models/metrics.json"
labels_path = "backend/src/data/models/labels.json"

def init_tokenizer(llm_model=LLM_MODEL):
    return AutoTokenizer.from_pretrained(llm_model)

## Data Preparation

def data_preparation(json_data):
    df = pd.DataFrame(json_data).drop_duplicates(subset=['subject','body'])
    topic_counts = df['topic'].value_counts().to_dict()
    stats = {
        "dataset": "Global Dataset",
        "rows": len(df),
        "topics": topic_counts,
    }
    return stats

def get_device():
    return 'GPU' if str(device) == 'cuda:0' else 'CPU'

def get_labels(json_data, label='topic'):
    df = pd.DataFrame(json_data)
    labels = df[label].value_counts().index.tolist()
    return {label: idx for idx, label in enumerate(labels)}

def get_samples(json_data, topics_map, label='topic', num=50):
    df = pd.DataFrame(json_data)
    grouped = df.groupby(label)
    rows = [group.sample(n=min(num, len(group))) for _, group in grouped]
    df = pd.concat(rows).reset_index(drop=True)
    df[label] = df[label].map(topics_map)
    return df

class EmailDataset(Dataset):
    def __init__(self, subjects, bodies, topics, tokenizer, max_len):
        self.subjects = subjects
        self.bodies = bodies
        self.topics = topics
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.topics)

    def __getitem__(self, idx):
        subject = self.subjects.iloc[idx]
        body = self.bodies.iloc[idx]
        topic = self.topics.iloc[idx]

        encoding = self.tokenizer.encode_plus(
            text=subject,
            text_pair=body,
            add_special_tokens=True,
            max_length=self.max_len,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt',
            return_overflowing_tokens=False
        )

        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(topic, dtype=torch.long)
        }

## Training & Evaluation

def train_epoch(model, loader, optimizer, criterion, device):
    model.train()
    epoch_loss = 0
    correct_predictions = 0
    total_predictions = 0

    for batch in loader:
        input_ids = batch['input_ids'].to(device)
        attention_mask = batch['attention_mask'].to(device)
        labels = batch['labels'].to(device)

        optimizer.zero_grad()
        outputs = model(input_ids, attention_mask=attention_mask)
        logits = outputs.logits
        loss = criterion(logits, labels)
        loss.backward()
        optimizer.step()

        epoch_loss += loss.item()
        _, preds = torch.max(logits, 1)
        correct_predictions += (preds == labels).sum().item()
        total_predictions += labels.size(0)

    return epoch_loss / len(loader), correct_predictions / total_predictions

def evaluate(model, loader, criterion, device):
    model.eval()
    val_loss = 0
    correct_predictions = 0
    total_predictions = 0
    y_true, y_pred = [], []

    with torch.no_grad():
        for batch in loader:
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['labels'].to(device)

            outputs = model(input_ids, attention_mask=attention_mask)
            logits = outputs.logits
            val_loss += criterion(logits, labels).item()

            _, preds = torch.max(logits, 1)
            correct_predictions += (preds == labels).sum().item()
            total_predictions += labels.size(0)

            y_true.extend(labels.cpu().numpy())
            y_pred.extend(preds.cpu().numpy())

    val_loss /= len(loader)
    accuracy = correct_predictions / total_predictions
    precision, recall, f1, _ = precision_recall_fscore_support(y_true, y_pred, average='weighted', zero_division=0)

    return {
        "loss": round(val_loss, 4),
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1-score": round(f1, 4)
    }

def train_epoch(model, loader, optimizer, criterion, device):
    model.train()
    epoch_loss = 0
    correct_predictions = 0
    total_predictions = 0

    for batch in loader:
        input_ids = batch['input_ids'].to(device)
        attention_mask = batch['attention_mask'].to(device)
        labels = batch['labels'].to(device)

        optimizer.zero_grad()
        outputs = model(input_ids, attention_mask=attention_mask)
        logits = outputs.logits
        loss = criterion(logits, labels)
        loss.backward()
        optimizer.step()

        epoch_loss += loss.item()
        _, preds = torch.max(logits, 1)
        correct_predictions += (preds == labels).sum().item()
        total_predictions += labels.size(0)

    return epoch_loss / len(loader), correct_predictions / total_predictions

def train_model(model, train_loader, val_loader, optimizer, criterion, num_epochs, device):
    best_metrics = {"loss": float('inf'), "accuracy": 0}

    progress_bar = tqdm(range(num_epochs), desc="Training Progress", unit="epoch", ncols=120, colour='white')

    for _ in range(num_epochs):
        train_loss, train_acc = train_epoch(model, train_loader, optimizer, criterion, device)
        val_metrics = evaluate(model, val_loader, criterion, device)

        if val_metrics['loss'] < best_metrics['loss']:
            best_metrics = val_metrics
            torch.save(model.state_dict(), model_path)
            with open(metrics_path, "w") as f:
                json.dump(best_metrics, f)

        progress_bar.update(1)
        progress_bar.set_postfix({
            "train_loss": f"{train_loss:.2f}",
            "train_acc": f"{train_acc:.2f}",
            "val_loss": f"{val_metrics['loss']:.2f}",
            "val_acc": f"{val_metrics['accuracy']:.2f}"
        })

    progress_bar.close()

    return best_metrics

def training_process(tokenizer, json_data, num_epochs, batch_size, max_len, learning_rate):
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    
    topics_map = get_labels(json_data)
    data = get_samples(json_data, topics_map)

    model = AutoModelForSequenceClassification.from_pretrained(
        LLM_MODEL, num_labels=len(topics_map)
    ).to(device)

    # Load previous model if labels match
    if os.path.exists(labels_path):
        with open(labels_path, "r") as f:
            old_labels = json.load(f)
        if old_labels == topics_map and os.path.exists(model_path):
            model.load_state_dict(torch.load(model_path))

    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate)
    criterion = torch.nn.CrossEntropyLoss()

    train_data, val_data = train_test_split(data, test_size=0.2, random_state=42)

    train_loader = DataLoader(
        EmailDataset(train_data['subject'], train_data['body'], train_data['topic'], tokenizer, max_len),
        batch_size=batch_size, shuffle=True
    )
    val_loader = DataLoader(
        EmailDataset(val_data['subject'], val_data['body'], val_data['topic'], tokenizer, max_len),
        batch_size=batch_size, shuffle=False
    )

    best_metrics = train_model(model, train_loader, val_loader, optimizer, criterion, num_epochs, device)

    # Save labels
    with open(labels_path, "w") as f:
        json.dump(topics_map, f)

    return best_metrics

## Model Utilities

def reset_model(directory):
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        if os.path.isfile(file_path):
            os.remove(file_path)
    return True

def get_metrics():
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            return json.load(f)
    return None