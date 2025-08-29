import pandas as pd
import numpy as np
import json
import os
import re
import string
import random
import torch
import warnings
from transformers import AutoTokenizer, AutoModelForMaskedLM, logging
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from concurrent.futures import ThreadPoolExecutor
from libs.MailKit import json_to_json, csv_to_json, xlsx_to_json, mails_to_json
from config.envs import VEC_MODEL, LLM_MODEL

logging.get_logger("transformers").setLevel(logging.ERROR)
warnings.filterwarnings("ignore", category=UserWarning, module=r"transformers.*")
warnings.filterwarnings("ignore", category=FutureWarning, module=r"huggingface_hub.*")

## Variables

punctuation_list = re.escape(string.punctuation)

device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')

def init_sentence(embed_model=VEC_MODEL):
    sentence = SentenceTransformer(embed_model, device=device)
    return sentence

def init_pipes(llm_model=LLM_MODEL):
    tokenizer = AutoTokenizer.from_pretrained(llm_model)
    model = AutoModelForMaskedLM.from_pretrained(llm_model).to(device)
    return tokenizer, model

max_workers = max(4, os.cpu_count() // 2)

## Data Extraction

def data_extraction(src_path, dest_path):
    data = extract_data(src_path)
    df = pd.DataFrame(data)
    if df.empty:
        return False
    df = format_dataframe(df)
    df.to_csv(dest_path, index=False, sep=',', quotechar='"')
    return True
    
def extract_data(path):
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
        df = df[['subject', 'body', 'topic']]
        return df
    raise Exception('File format not compatible')

def get_files(path):
    try:
        df = pd.read_csv(path, sep=',', quotechar='"', engine='python', on_bad_lines='skip')
    except pd.errors.ParserError as e:
        return None

    filename = os.path.basename(path)
    rows_count = len(df)
    labeled_count = df['topic'].count() if 'topic' in df.columns else 0
    unlabeled_count = rows_count - labeled_count

    return {
        'filename': filename,
        'rows_count': int(rows_count),
        'labeled_count': int(labeled_count),
        'unlabeled_count': int(unlabeled_count)
    }

## Data Cleaning

def data_cleaning(sentence, path):
    df = pd.read_csv(path, sep=',', quotechar='"', engine='python', on_bad_lines='skip')
    if df.empty:
        return False
    df = process_cols(sentence, df)
    df.to_csv(path, index=False, sep=',', quotechar='"')
    return True

def process_cols(sentence, df):
    df = df.dropna(subset=['subject','body'])
    df = df.drop_duplicates(subset=['subject','body'])
    df = df.sample(frac=1).reset_index(drop=True)
    df = clean_col(df, column_name='subject')
    df = process_col(sentence, df, column_name='body')
    return df

def clean_col(df, column_name):
    df.loc[:, column_name] = df[column_name].apply(clean_mail)
    return df   

def process_col(sentence, df, column_name):
    df = clean_col(df, column_name)
    df = df.dropna(subset=[column_name])
    df = df.drop_duplicates(subset=[column_name])
    df = df.sample(frac=1).reset_index(drop=True)
    
    df['bert_embedding'] = df[column_name].apply(lambda x: get_embeddings(sentence, x))
    df = drop_duplicates(df)
    df = df.drop(columns=['bert_embedding'])
    df = df.sample(frac=1).reset_index(drop=True)
    return df


def clean_mail(text):
    text = re.sub(r'\s*\n+\s*', '\u7102', text)
    pattern = re.compile(fr'\s*([{punctuation_list}])\s+')
    text = re.sub(pattern, r'\1 ', text)
    text = re.sub(r'\s+', ' ', text)
    pattern = re.compile(fr'[{punctuation_list}]{{2,}}')
    text = re.sub(pattern, '', text)
    pattern = re.compile(fr'[^\w\s\d{punctuation_list}].+')
    text = re.sub(pattern, '', text)
    text = re.sub(r'\u7102', '\n', text)
    return text.strip()

def get_embeddings(sentence, text):
    embeddings = sentence.encode(text)
    if isinstance(embeddings, torch.Tensor):
        embeddings = embeddings.cpu().numpy()
    return embeddings

def get_similarity(embeds1, embeds2):
    similarity = cosine_similarity([embeds1], [embeds2])[0][0]
    return similarity

def drop_duplicates(df, similarity_threshold=0.99):
    embeddings = np.stack(df['bert_embedding'].values)
    sim_matrix = cosine_similarity(embeddings)
    
    n = sim_matrix.shape[0]
    to_remove = set()
    for i in range(n):
        if i not in to_remove:
            for j in range(i + 1, n):
                if sim_matrix[i, j] >= similarity_threshold:
                    to_remove.add(j)
    
    df = df.drop(list(to_remove)).reset_index(drop=True)
    return df

## Data Labeling

def data_labeling(path, json_data):
    df = pd.DataFrame(json_data)
    if df.empty:
        return False
    df.to_csv(path, index=False, sep=',', quotechar='"')
    return True

def filter_by_topics(path, topics):
    df = pd.read_csv(path, sep=',', quotechar='"', engine='python', on_bad_lines='skip')
    filtered_df = df[df['topic'].isin(topics) | df['topic'].isnull()]
    if len(filtered_df) == 0:
        raise Exception('No valid data found')
    json_data = json.loads(filtered_df.to_json(orient='records'))
    return json_data

## Data Reduction

def data_reduction(sentence, path, actions):
    df = pd.read_csv(path, sep=',', quotechar='"', engine='python', on_bad_lines='skip')
    if df.empty:
        return False
    df = process_rows(sentence, df, actions=actions)
    df.to_csv(path, index=False, sep=',', quotechar='"')
    return True

def process_rows(sentence, df, actions, n_workers=max_workers):
    df['action'] = df['topic'].replace(actions)
    with ThreadPoolExecutor(max_workers=n_workers) as executor:
        results = list(executor.map(lambda row: process_row(sentence, row['body'], row['action']), [row for _, row in df.iterrows()]))
    df['body'] = pd.DataFrame(results, index=df.index)
    df = df.dropna(subset=['body','topic'])
    df = df.drop_duplicates(subset=['subject','body'])
    df = df.sample(frac=1).reset_index(drop=True)
    return df[['subject', 'body', 'topic']]

def process_row(sentence, text, topic, max_num=3, threshold=0.2):
    if pd.isna(topic) or not isinstance(text, str):
        return text

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if not paragraphs:
        return None

    scored_paragraphs = []
    for idx, para in enumerate(paragraphs):
        if len(para.split()) > 1:
            similarity = get_similarity(get_embeddings(sentence, para), get_embeddings(sentence, topic))
            if similarity > threshold:
                scored_paragraphs.append((para, similarity, idx))

    if not scored_paragraphs:
        return None

    scored_paragraphs = sorted(scored_paragraphs, key=lambda x: x[1], reverse=True)
    scored_paragraphs = scored_paragraphs[:min(max_num, len(scored_paragraphs))]
    scored_paragraphs = sorted(scored_paragraphs, key=lambda x: x[2])

    return "\n\n".join([p[0] for p in scored_paragraphs])

## Data Augmentation

def data_augmentation(tokenizer, model, path):
    df = pd.read_csv(path, sep=',', quotechar='"', engine='python', on_bad_lines='skip')
    if df.empty:
        return False, None, None
    df = generate_rows(tokenizer, model, df)
    df.to_csv(path, index=False, sep=',', quotechar='"')

    data = json.loads(df.to_json(orient='records'))
    topic_counts = df['topic'].value_counts().to_dict()
    stats = {
        "dataset": os.path.basename(path),
        "rows": len(df),
        "topics": topic_counts,
    }
    return True, data, stats

def generate_rows(tokenizer, model, df):
    augmented_data = []
    mean_count = int(df['topic'].value_counts().mean())

    for topic, group in df.groupby('topic'):
        current_rows = len(group)
        difference = (mean_count - current_rows) // current_rows
        if difference > 0:
            for _, row in group.iterrows():
                for _ in range(difference):
                    paraphrased_subject = paraphrase_text(tokenizer, model, row['subject'])
                    paraphrased_body = paraphrase_text(tokenizer, model, row['body'])
                    augmented_data.append({'subject': paraphrased_subject, 'body': paraphrased_body, 'topic': topic})

        for _, row in group.iterrows():
            augmented_data.append({'subject': row['subject'], 'body': row['body'], 'topic': topic})

    augmented_df = pd.DataFrame(augmented_data)
    augmented_df = augmented_df.drop_duplicates(subset=['subject','body'])
    augmented_df = augmented_df.sample(frac=1).reset_index(drop=True)

    return augmented_df

def paraphrase_text(tokenizer, model, text, masked_per=0.1, threshold=0.5):
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
