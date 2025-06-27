from config.mlibs import *



## Variables

punctuation_list = re.escape(string.punctuation)

device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
sentence = SentenceTransformer("sentence-transformers/paraphrase-multilingual-mpnet-base-v2", device=device)
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model = BertForMaskedLM.from_pretrained('bert-base-uncased').to(device)

nlp = spacy.load("en_core_web_md")
max_workers = max(4, os.cpu_count() // 2)



## Data Extraction

def data_extraction(src_path, dest_path):
    data = extract_data(src_path)
    df = pd.DataFrame(data)
    if df.empty:
        return False
    df = format_dataframe(df)
    df.to_csv(dest_path, index=False, sep='|')
    return True
    
def extract_data(path):
    from libs.MailKit import json_to_json, csv_to_json, xlsx_to_json, mails_to_json

    extension = os.path.splitext(path)[1]
    if extension == ".json":
        data = json_to_json(path)
    elif extension == ".csv":
        data = csv_to_json(path)['tables']
    elif extension in [".xls",".xlsx"]:
        data = xlsx_to_json(path)['tables'][0]
    elif extension == "":
        data = mails_to_json(path)
    return data

def format_dataframe(df):
    if len(df.columns) == 3:
        topics = df.columns[df.nunique().argmin()]
        bodies = df[df.columns.difference([topics])].apply(lambda x: x.str.len().mean()).idxmax()
        subjects = df.columns[(df.columns != topics) & (df.columns != bodies)][0]
        df = df[[subjects, bodies, topics]]
        df = df.rename(columns={subjects: 'subject', bodies: 'body', topics: 'topic'})
        return df
    elif len(df.columns) == 2:
        bodies = df.apply(lambda x: x.str.len().mean()).idxmax()
        subjects = df.columns[df.columns != bodies][0]
        df = df[[subjects, bodies]]
        df = df.rename(columns={subjects: 'subject', bodies: 'body'})
        df['topic'] = np.nan
        return df
    raise Exception('File format not compatible')

def get_files(path):
    df = pd.read_csv(path, sep='|')

    filename = os.path.basename(path)
    rows_count = len(df)
    labeled_count = df['topic'].count()
    unlabeled_count = rows_count - labeled_count

    return {
        'filename': filename,
        'rows_count': int(rows_count),
        'labeled_count': int(labeled_count),
        'unlabeled_count': int(unlabeled_count)
    }



## Data Cleaning

def data_cleaning(path):
    df = pd.read_csv(path, sep='|')
    if df.empty:
        return False
    df = process_cols(df)
    df.to_csv(path, index=False, sep='|')
    return True

def process_cols(df):
    df = df.dropna(subset=['subject','body'])
    df = df.drop_duplicates(subset=['subject','body'])
    df = df.sample(frac=1).reset_index(drop=True)
    df = clean_col(df, column_name='subject')
    df = process_col(df, column_name='body')
    return df

def clean_col(df, column_name):
    df.loc[:, column_name] = df[column_name].apply(clean_mail)
    return df   

def process_col(df, column_name, similarity_threshold=0.99, batch_size=512):
    df = clean_col(df, column_name)
    df = df.dropna(subset=[column_name])
    df = df.drop_duplicates(subset=[column_name])
    df = df.sample(frac=1).reset_index(drop=True)
    results = []
    for i in range(0, len(df), batch_size):
        batch_df = df[i:i+batch_size].copy()
        batch_df['bert_embedding'] = batch_df[column_name].apply(get_embeddings)
        batch_df = drop_duplicates(batch_df, similarity_threshold)
        batch_df = batch_df.drop(columns=['bert_embedding'])
        results.append(batch_df)
    df = pd.concat(results)
    return df

def clean_mail(text):
    text = re.sub(r'\s*\n+\s*', '\u7102', text)
    pattern = re.compile(f'\s*([{punctuation_list}])\s+')
    text = re.sub(pattern, '\\1 ', text)
    text = re.sub(r'\s+', ' ', text)
    pattern = re.compile(f'[{punctuation_list}]{{2,}}')
    text = re.sub(pattern, '', text)
    pattern = re.compile(f'[^\w\s\d{punctuation_list}].+')
    text = re.sub(pattern, '', text)
    text = re.sub(r'\u7102', '\n', text)
    return text.strip()

def get_embeddings(text):
    embeddings = sentence.encode(text)
    return embeddings

def get_similarity(embeds1, embeds2):
    similarity = cosine_similarity([embeds1], [embeds2])[0][0]
    return similarity

def drop_duplicates(df, similarity_threshold):
    indices_to_remove = set()
    
    for i, row1 in df.iterrows():
        if i not in indices_to_remove:
            for j, row2 in df.iterrows():
                if j not in indices_to_remove and i != j:
                    similarity = get_similarity(row1['bert_embedding'], row2['bert_embedding'])
                    if similarity >= similarity_threshold:
                        indices_to_remove.add(j)
                        
    df = df.drop(indices_to_remove).reset_index(drop=True)
    return df



## Data Labeling

def data_labeling(path, json_data):
    df = pd.DataFrame(json_data)
    if df.empty:
        return False
    df.to_csv(path, index=False, sep='|')
    return True

def filter_by_topics(path, topics):
    df = pd.read_csv(path, sep='|')
    filtered_df = df[df['topic'].isin(topics) | df['topic'].isnull()]
    if len(filtered_df) == 0:
        raise Exception('No valid data found')
    json_data = json.loads(filtered_df.to_json(orient='records'))
    return json_data



## Data Reduction

def data_reduction(path, actions):
    df = pd.read_csv(path, sep='|')
    if df.empty:
        return False
    df = process_rows(df, actions=actions)
    df.to_csv(path, index=False, sep='|')
    return True

def process_rows(df, actions, n_workers=max_workers):
    df['action'] = df['topic'].replace(actions)
    with ThreadPoolExecutor(max_workers=n_workers) as executor:
        results = list(executor.map(lambda row: process_row(row['body'], row['action']), [row for _, row in df.iterrows()]))
    df['body'] = pd.DataFrame(results, index=df.index)
    df = df.dropna(subset=['body','topic'])
    df = df.drop_duplicates(subset=['subject','body'])
    df = df.sample(frac=1).reset_index(drop=True)
    return df[['subject', 'body', 'topic']]

def process_row(text, topic, max_num=3, threshold=0.2):
    if pd.isna(topic):
        return text
    doc = nlp(text)
    
    sents = []
    for index, sent in enumerate(doc.sents):
        if len(sent.text.split()) > 1:
            similarity = get_similarity(get_embeddings(sent.text), get_embeddings(topic))
            if similarity > threshold:
                sents.append((sent.text,similarity,index))
                
    sorted_sents = sorted(sents, key=lambda x: x[1], reverse=True)
    sorted_sents = sorted_sents[:min(max_num,len(sorted_sents))]
    sorted_sents = sorted(sorted_sents, key=lambda x: x[2])
    
    if sorted_sents:
        text = ' '.join(list(zip(*sorted_sents))[0])
    else:
        text = None
    return text



## Data Augmentation

def data_augmentation(path):
    df = pd.read_csv(path, sep='|')
    if df.empty:
        return False, None, None
    df = generate_rows(df)
    df.to_csv(path, index=False, sep='|')

    data = json.loads(df.to_json(orient='records'))
    topic_counts = df['topic'].value_counts().to_dict()
    stats = {
        "dataset": os.path.basename(path),
        "rows": len(df),
        "topics": topic_counts,
    }
    return True, data, stats

def generate_rows(df):
    augmented_data = []
    mean_count = int(df['topic'].value_counts().mean())

    for topic, group in df.groupby('topic'):
        current_rows = len(group)
        difference = (mean_count - current_rows) // current_rows
        if difference > 0:
            for _, row in group.iterrows():
                for _ in range(difference):
                    paraphrased_subject = paraphrase_text(row['subject'])
                    paraphrased_body = paraphrase_text(row['body'])
                    augmented_data.append({'subject': paraphrased_subject, 'body': paraphrased_body, 'topic': topic})

        for _, row in group.iterrows():
            augmented_data.append({'subject': row['subject'], 'body': row['body'], 'topic': topic})

    augmented_df = pd.DataFrame(augmented_data)
    augmented_df = augmented_df.drop_duplicates(subset=['subject','body'])
    augmented_df = augmented_df.sample(frac=1).reset_index(drop=True)

    return augmented_df

def paraphrase_text(text, masked_per=0.1, threshold=0.5):
    tokens = tokenizer.tokenize(text)
    masked_indices = random.sample(range(len(tokens)), max(1, int(masked_per*len(tokens))))
    masked_tokens = tokens.copy()

    for idx in masked_indices:
        masked_tokens[idx] = '[MASK]'
    input_ids = tokenizer.encode(' '.join(masked_tokens), return_tensors='pt').to(device)
    with torch.no_grad():
        outputs = model(input_ids)
        predictions = outputs[0]
        for _, idx in enumerate(masked_indices):
            predicted_index = torch.argmax(predictions[0, idx]).item()
            predicted_prob = torch.softmax(predictions[0, idx], dim=-1)[predicted_index].item()
            if predicted_prob > threshold:
                predicted_token = tokenizer.decode([predicted_index])
                masked_tokens[idx] = predicted_token
            else:
                masked_tokens[idx] = tokens[idx]

    return tokenizer.decode(tokenizer.convert_tokens_to_ids(masked_tokens))
