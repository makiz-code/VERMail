from config.mlibs import *



## Variables

device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')

model_path = "backend/data/models/VERModel.pth"
metrics_path = "backend/data/models/metrics.pth"
labels_path = "backend/data/models/labels.pth"



## Data Preparation & Formatting

def data_preparation(json_data):
    df = pd.DataFrame(json_data)
    df = df.drop_duplicates(subset=['subject','body'])

    topic_counts = df['topic'].value_counts().to_dict()
    stats = {
        "dataset": "Global Dataset",
        "rows": len(df),
        "topics": topic_counts,
    }
    return stats

def get_device():
    if str(device) == 'cuda:0':
        return 'GPU'
    return str(device)

def get_labels(json_data, label='topic'):
    df = pd.DataFrame(json_data)
    labels = df[label].value_counts().index.tolist()
    labels = {label: idx for idx, label in enumerate(labels)}
    return labels

def get_samples(json_data, topics_map, label='topic', num=50):
    df = pd.DataFrame(json_data)
    grouped = df.groupby(label)
    
    rows = []
    for _, group in grouped:
        sample = group.sample(n=min(num, len(group)))
        rows.append(sample)
    df = pd.concat(rows)
    df = df.reset_index(drop=True)
    
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



## Model Training & Evaluation

def train_model(model, train_loader, test_loader, optimizer, criterion, num_epochs, device):
    # Training phase
    for _ in range(num_epochs):
        train_epoch(model, train_loader, optimizer, criterion, device)
        
    # Evaluation phase
    history = evaluate(model, test_loader, criterion, device)
    return history

def train_epoch(model, train_loader, optimizer, criterion, device):
    epoch_loss = 0
    correct_predictions = 0
    total_predictions = 0
    
    model.train()
    
    for batch in train_loader:
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

        _, predicted_labels = torch.max(logits, 1)
        correct_predictions += (predicted_labels == labels).sum().item()
        total_predictions += labels.size(0)

    epoch_loss /= len(train_loader)
    epoch_accuracy = correct_predictions / total_predictions
    
    return epoch_loss, epoch_accuracy

def evaluate(model, test_loader, criterion, device):
    test_loss = 0
    test_correct_predictions = 0
    test_total_predictions = 0
    y_true_test = []
    y_pred_test = []
    
    model.eval()
    
    with torch.no_grad():
        for test_batch in test_loader:
            input_ids_test = test_batch['input_ids'].to(device)
            attention_mask_test = test_batch['attention_mask'].to(device)
            labels_test = test_batch['labels'].to(device)

            test_outputs = model(input_ids_test, attention_mask=attention_mask_test)
            test_logits = test_outputs.logits
            test_loss += criterion(test_logits, labels_test).item()

            _, test_predicted_labels = torch.max(test_logits, 1)
            test_correct_predictions += (test_predicted_labels == labels_test).sum().item()
            test_total_predictions += labels_test.size(0)

            y_true_test.extend(labels_test.cpu().numpy())
            y_pred_test.extend(test_predicted_labels.cpu().numpy())

    test_loss /= len(test_loader)
    test_accuracy = test_correct_predictions / test_total_predictions
    test_precision, test_recall, test_f1, _ = precision_recall_fscore_support(y_true_test, y_pred_test, average='weighted', zero_division=0)

    history = {
        "loss": round(test_loss,4), 
        "accuracy": round(test_accuracy,4), 
        "precision": round(test_precision,4), 
        "recall": round(test_recall,4), 
        "f1-score": round(test_f1,4)
    }
    
    return history

def training_process(json_data, num_epochs, batch_size, max_len, learning_rate):
    topics_map = get_labels(json_data)
    data = get_samples(json_data, topics_map)

    model = BertForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=len(topics_map)).to(device)
    if os.path.exists(labels_path):
        old_labels = torch.load(labels_path)
        if old_labels == topics_map:
            model.load_state_dict(torch.load(model_path))
        else:
            os.remove(model_path)
            os.remove(metrics_path)
            os.remove(labels_path)

    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate)
    criterion = torch.nn.CrossEntropyLoss()

    train_data, test_data = train_test_split(data, test_size=0.2, random_state=42)

    train_dataset = EmailDataset(train_data['subject'], train_data['body'], train_data['topic'], tokenizer=tokenizer, max_len=max_len)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)

    test_dataset = EmailDataset(test_data['subject'], test_data['body'], test_data['topic'], tokenizer=tokenizer, max_len=max_len)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=True)

    history = train_model(model, train_loader, test_loader, optimizer, criterion, num_epochs, device)

    if os.path.exists(metrics_path):
        best_metrics = torch.load(metrics_path)
    else: 
        best_metrics = {'loss': 100, 'accuracy': 0}

    if (history['accuracy'] / history['loss']) > (best_metrics['accuracy'] / best_metrics['loss']):
        best_metrics = history
        train_model(model, test_loader, test_loader, optimizer, criterion, num_epochs, device)
        torch.save(model.state_dict(), model_path)
        torch.save(best_metrics, metrics_path)
        torch.save(topics_map, labels_path)

    return best_metrics

def reset_model(directory):
    if os.path.exists(model_path) or os.path.exists(metrics_path) or os.path.exists(labels_path):
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
        return True
    else:
        False

def get_metrics():
    if os.path.exists(metrics_path):
        return torch.load(metrics_path)
    else:
        return None
    