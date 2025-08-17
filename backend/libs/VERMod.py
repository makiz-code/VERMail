from config.mlibs import *



## Variables

device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')

model_path = "backend/data/models/VERModel.pth"
metrics_path = "backend/data/models/metrics.pth"
labels_path = "backend/data/models/labels.pth"



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
    return 'GPU' if str(device) == 'cuda:0' else str(device)

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
            subject,
            body,
            add_special_tokens=True,
            max_length=self.max_len,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt'
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

def train_model(model, train_loader, val_loader, optimizer, criterion, num_epochs, device):
    best_metrics = {"loss": float('inf'), "accuracy": 0}
    for epoch in range(num_epochs):
        train_loss, train_acc = train_epoch(model, train_loader, optimizer, criterion, device)
        val_metrics = evaluate(model, val_loader, criterion, device)

        # Save best model
        if val_metrics['loss'] < best_metrics['loss']:
            best_metrics = val_metrics
            torch.save(model.state_dict(), model_path)
            torch.save(best_metrics, metrics_path)

    return best_metrics

def training_process(json_data, num_epochs=3, batch_size=16, max_len=128, learning_rate=5e-5):
    topics_map = get_labels(json_data)
    data = get_samples(json_data, topics_map)

    model = BertForSequenceClassification.from_pretrained(
        'bert-base-uncased', num_labels=len(topics_map)
    ).to(device)

    # Load previous model if labels match
    if os.path.exists(labels_path):
        old_labels = torch.load(labels_path)
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
    torch.save(topics_map, labels_path)
    return best_metrics



## Reset Model

def reset_model(directory):
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        if os.path.isfile(file_path):
            os.remove(file_path)
    return True



## Get Metrics

def get_metrics():
    if os.path.exists(metrics_path):
        return torch.load(metrics_path)
    return None