import pandas as pd
import numpy as np
import pytesseract
import PyPDF2
import tabula
import spacy
import email
import json
import mimetypes
import fitz
import base64
import os
import re
import string
from pdf2image import convert_from_path
from extract_msg import Message
from datetime import datetime
from pptx import Presentation
from docx import Document

punctuation_list = re.escape(string.punctuation)

nlp = spacy.load("en_core_web_md")

def clean_text(text):
    text = re.sub(r'\s*\n+\s*', '\u7102', text)
    pattern = re.compile(f'\s*([{punctuation_list}])\s+')
    text = re.sub(pattern, '\\1 ', text)
    text = re.sub(r'\s+', ' ', text)
    pattern = re.compile(f'[{punctuation_list}]{{2,}}')
    text = re.sub(pattern, '', text)
    text = re.sub(r'\u7102', '\n', text)
    return text.strip()

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

def sanitize_filename(filename):
    basename, extension = os.path.splitext(filename)
    
    basename = basename.strip()
    basename = re.sub(r'\W+', '_', basename)
    
    extension = extension.strip()
    extension = re.sub(r'\W+', '', extension)
    
    sanitized_filename = basename + "." + extension.lower()
    return sanitized_filename

def get_content_type(filename):
    content_type, _ = mimetypes.guess_type(filename)
    return content_type

def json_to_json(path):
    with open(path) as file:
        json_data = json.load(file)
    return json_data

def csv_to_json(path, delimiter=','):
    df = pd.read_csv(path, delimiter=delimiter)
    
    df.replace(r'^\s*$', np.nan, regex=True).dropna(axis=0, how='all').dropna(axis=1, how='all')
    json_str = df.to_json(orient='records')

    json_data = {}
    if json_str:
        json_data["tables"] = json.loads(json_str)

    return json_data

def get_ocr_tokens(path, psm):
    text = pytesseract.image_to_string(path, config=r'--oem 3 --psm '+str(psm), lang='eng')
    tokens = re.split(r'\n+', text) + ['\n']
    return tokens

def img_to_json(path):
    text = "\n".join(get_ocr_tokens(path, 6)).strip()
    tokens = get_ocr_tokens(path, 12)

    json_data = {}
    if text:
        json_data["text"] = text
    if tokens:
        json_data["tokens"] = tokens

    return json_data

def create_dir(dir_name):
    if not os.path.exists(dir_name):
        os.makedirs(dir_name)
    dir_path = os.path.abspath(dir_name)
    return dir_path

def get_all_emails_data(json_emails_file):
    with open(json_emails_file, "r") as json_file:
        data = json.load(json_file)
    return data

def set_all_emails_data(json_emails_file, emails):
    with open(json_emails_file, 'w') as json_file:
        json.dump(emails, json_file, indent=4)

def get_file_with_payload(path):
    with open(path, 'rb') as file:
        payload = file.read()
    base64_payload = base64.b64encode(payload).decode('utf-8')
    return base64_payload

def set_file_with_payload(path, base64_payload):
    payload = base64.b64decode(base64_payload.encode('utf-8'))
    with open(path, 'wb') as file:
        file.write(payload)

def convert_datetimes(obj):
    if isinstance(obj, dict):
        return {k: convert_datetimes(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_datetimes(i) for i in obj]
    elif isinstance(obj, datetime):
        return obj.strftime("%m/%d/%Y %H:%M:%S")
    else:
        return obj

def extract_email_data(msg):
    try:
        subject = msg["Subject"]
        sender = email.utils.parseaddr(msg["From"])[1]
        to_recipients = [email.utils.parseaddr(addr)[1] for addr in msg.get_all('To', [])]
        cc_recipients = [email.utils.parseaddr(addr)[1] for addr in msg.get_all('Cc', [])]

        date_str = msg.get('Date', '')
        if date_str:
            date_obj = email.utils.parsedate_to_datetime(date_str)
            datetime_combined = date_obj.strftime("%m/%d/%Y %H:%M:%S")
        else:
            datetime_combined = ''

        body, attachments = extract_body_and_attachments(msg)

        email_dict = {
            "subject": clean_mail(subject),
            "from": sender.replace('"', ''),
            "to": [element.replace('"', '') for element in to_recipients],
            "cc": [element.replace('"', '') for element in cc_recipients],
            "datetime": datetime_combined,
            "body": clean_mail(body),
            "attachments": attachments
        }

        email_dict = convert_datetimes(email_dict)

        return email_dict

    except Exception as e:
        raise Exception(f"Error parsing email data: {str(e)}")

def extract_body_and_attachments(msg):
    body = ""
    attachments = []

    for part in msg.walk():
        if part.get_content_type() == "text/plain":
            try:
                body += part.get_payload(decode=True).decode("UTF-8")
            except UnicodeDecodeError:
                body += part.get_payload(decode=True).decode("ISO-8859-1", errors="replace")
        elif part.get_content_maintype() == "multipart":
            continue
        else:
            filename = part.get_filename()
            if filename:
                sanitized_filename = sanitize_filename(filename)
                content_type = part.get_content_type()
                payload = part.get_payload(decode=True)

                dir_path = create_dir("backend/data/records")
                path = os.path.join(dir_path, sanitized_filename)

                # Save attachment file
                with open(path, "wb") as file:
                    file.write(payload)

                imgs = []
                components = scrap_data_file(path)
                if 'images' in components:
                    imgs = components.pop('images')
                base64_payload = get_file_with_payload(path)
                attachments.append({
                    "filename": sanitized_filename, 
                    "content_type": content_type, 
                    "components": components, 
                    "payload": base64_payload
                })
                
                if imgs:
                    for a in imgs:
                        attachments.append(a)

    return body, attachments

def scrap_data_file(path):
    extension = os.path.splitext(path)[1]
    if extension == ".csv":
        data = csv_to_json(path)
    elif extension == ".pdf":
        data = pdf_to_json(path)
    elif extension in [".xls",".xlsx"]:
        data = xlsx_to_json(path)
    elif extension == ".docx":
        data = docx_to_json(path)
    elif extension == ".pptx":
        data = pptx_to_json(path)
    elif extension in ['.jpg', '.png']:
        data = img_to_json(path)
        if "text" in data:
            data = {"text": clean_text(data["text"])}
        else:
            data = {}
    else: 
        data = {"error": "Unsupported Content Type"}
    return data

def eml_to_json(path):
    with open(path, 'r') as file:
        msg = email.message_from_file(file)
        json_data = extract_email_data(msg)
    return json_data

def msg_to_json(path):
    msg = Message(path)
    attachments_objects = msg.attachments 
    
    attachments = []            
    for attachment in attachments_objects:
        filename = attachment.name
        sanitized_filename = sanitize_filename(filename)
        content_type = get_content_type(sanitized_filename)
        payload = attachment.data

        dir_path = create_dir("backend/data/records")
        path = os.path.join(dir_path, sanitized_filename)

        # Save attachment file
        with open(path, "wb") as file:
            file.write(payload)

        imgs = []
        components = scrap_data_file(path)
        if 'images' in components:
            imgs = components.pop('images')
        base64_payload = get_file_with_payload(path)
        attachments.append({
            "filename": sanitized_filename, 
            "content_type": content_type, 
            "components": components, 
            "payload": base64_payload
        })

        if imgs:
            for a in imgs:
                attachments.append(a)

    sender = email.utils.parseaddr(msg.sender)[1]
    to_recipients = [email.utils.parseaddr(msg.to)[1]] if msg.to else []
    cc_recipients = [email.utils.parseaddr(msg.cc)[1]] if msg.cc else []

    datetime_combined = msg.date.strftime('%m/%d/%Y %H:%M:%S') if msg.date else ''

    json_data = {
        "subject": clean_mail(msg.subject),
        "from": sender,
        "to": to_recipients,
        "cc": cc_recipients,
        "datetime": datetime_combined,
        "body": clean_mail(msg.body),
        "attachments": attachments
    }
    
    return json_data

def mails_to_json(folder_path):
    json_data = []
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if os.path.isfile(file_path):
            if os.path.splitext(file_path)[1] == '.eml':
                with open(file_path, 'r') as file:
                    msg = email.message_from_file(file)
                    subject = msg["Subject"]
                    body = ""
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain":
                            try:
                                body += part.get_payload(decode=True).decode("UTF-8")
                            except UnicodeDecodeError:
                                body += part.get_payload(decode=True).decode("ISO-8859-1", errors="replace")
            elif os.path.splitext(file_path)[1] == '.msg':
                msg = Message(file_path)
                subject = msg.subject
                body = msg.body
            json_data.append({'subject': clean_mail(subject), 'body': clean_mail(body)})
    return json_data

def delete_folder_contents(folder_path):
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                delete_folder_contents(file_path)
                os.rmdir(file_path)
        except Exception as e:
            raise Exception(f"Failed to delete {file_path}: {str(e)}")

def get_total_pages(path):
    with open(path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        total_pages = len(reader.pages)
    return total_pages

def get_pdf_dimensions(path):
    with open(path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        page = reader.pages[0]
        width = page.mediabox.width
        height = page.mediabox.height
        return width, height

def pdf_to_json(path):
    json_data = {}
    
    if get_total_pages(path) > 5:
        return json_data
        
    text, _ = extract_text_from_pdf(path)
    tables = extract_tables_from_pdf(path)
    images = extract_images_from_pdf(path)
    
    if text:
        json_data["text"] = clean_text(text)
    if tables:
        json_data["tables"] = tables
    if images:
        json_data["images"] = images
        
    return json_data

def extract_text_from_pdf(path):
    images = convert_from_path(path)
    text = ""
    tokens = []
    
    for image in images:
        json_data = img_to_json(image)
        text += json_data['text']
        tokens += json_data['tokens']

    return text, tokens

def extract_tables_from_pdf(path):
    dfs = []
    pages = get_total_pages(path)
    for page in range(1, pages + 1):
        try:
            page_dfs = tabula.read_pdf(path, pages=page, stream=True, multiple_tables=True)
            dfs.extend([df for df in page_dfs if not df.empty])
        except UnicodeDecodeError as e:
            raise Exception(f"Error parsing table: {str(e)}")
        
    # Merge consecutive DataFrames with the same columns
    merged_dfs = []
    buffer_df = dfs[0] if dfs else None

    for next_df in dfs[1:]:
        merge_needed = False
        if len(buffer_df.columns) == len(next_df.columns):
            is_header = True
            for col in next_df.columns:
                col_str = str(col)
                if col_str == 'nan' or 'Unnamed:' in col_str:
                    is_header = False
                    break
                if not re.match(r'^[a-zA-Z]+[!"\#\$%\&\(\)\*\+,\-\./:;<=>\?@\[\\\]\^_`\{\|\}\~\w\s]*$', col_str):
                    is_header = False
                    break
                doc = nlp(col_str)
                row_entity_types = {"DATE", "TIME", "GPE", "LOC", "MONEY",
                                    "QUANTITY", "ORDINAL", "CARDINAL", "PERCENT"}
                if any(token.ent_type_ in row_entity_types for token in doc):
                    is_header = False
                    break
            if not is_header:
                merge_needed = True

        if merge_needed:
            rows = [next_df.columns.tolist()] + next_df.values.tolist()
            buffer_df = pd.concat([buffer_df, pd.DataFrame(rows, columns=buffer_df.columns.tolist())], ignore_index=True)
        else:
            merged_dfs.append(buffer_df)
            buffer_df = next_df

    if buffer_df is not None:
        merged_dfs.append(buffer_df)

    tables = []
    for df in merged_dfs:
        data = df.replace([pd.NaT, np.nan], None).to_json(orient='records')
        tables.append(json.loads(data))

    return tables

def extract_images_from_pdf(path):
    with fitz.open(path) as pdf:
        images = []
        for page_num in range(len(pdf)):
            page = pdf.load_page(page_num)

            for img_index, img in enumerate(page.get_images(full=True)):
                xref = img[0]
                base_image = pdf.extract_image(xref)
                if base_image is None:
                    continue
                payload = base_image["image"]
                
                dir_path = os.path.dirname(path)
                basename,_ = os.path.splitext(os.path.basename(path))
                filename = f'{basename}_page_{page_num+1}_image_{img_index+1}.png'
                image_path = os.path.join(dir_path, filename)
                
                with open(image_path, "wb") as image_file:
                    image_file.write(payload)
                
                img_data = img_to_json(image_path)
                if "text" in img_data:
                    img_data = {"text": clean_text(img_data["text"])}
                else:
                    img_data = {}

                content_type = get_content_type(image_path)
                base64_payload = get_file_with_payload(image_path)
                images.append({
                    "filename": filename, 
                    "content_type": content_type, 
                    "components": img_data, 
                    "payload": base64_payload
                })
                    
                return images

def docx_to_json(path):
    Document(path)
    pdf_path = convert_docx_to_pdf(path)
    json_data = pdf_to_json(pdf_path)
    return json_data

def convert_docx_to_pdf(docx_path):
    from docx2pdf import convert
    pdf_path = docx_path.replace('.docx', '.pdf')
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    pdf_dir = os.path.dirname(docx_path)
    convert(docx_path, pdf_dir)
    return pdf_path

def pptx_to_json(path):
    Presentation(path)
    pdf_path = convert_pptx_to_pdf(path)
    json_data = pdf_to_json(pdf_path)
    return json_data

def convert_pptx_to_pdf(pptx_path):
    from pptxtopdf import convert
    pdf_path = pptx_path.replace('.pptx', '.pdf')
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    pdf_dir = os.path.dirname(pptx_path)
    convert(pptx_path, pdf_dir)
    return pdf_path

def xlsx_to_json(path):
    dataframes = xlsx_to_dataframes(path)
    json_dataframes = []
    for df in dataframes:
        data = df.replace([pd.NaT, np.nan], None).to_dict(orient='records')
        for dictionary in data:
            for key, value in dictionary.items():
                if isinstance(value, pd.Timestamp):
                    dictionary[key] = value.strftime('%d/%m/%Y %H:%M:%S')
        json_dataframes.append(data)
    
    json_data = {}
    if json_dataframes:
        json_data["tables"] = json_dataframes
    
    return json_data

def xlsx_to_dataframes(path):
    df = pd.read_excel(path, sheet_name=None)
    dataframes = []

    for _, sheet_df in df.items():
        headers = sheet_df.columns.tolist()
        header_row = pd.DataFrame([headers], columns=headers)
        sheet_df = pd.concat([header_row, sheet_df], ignore_index=True)
        
        empty_row_indices = sheet_df.index[sheet_df.isnull().all(axis=1)].tolist()
        start_index = 0

        for end_index in empty_row_indices:
            if start_index != end_index:
                sub_df = process_sub_df(sheet_df.iloc[start_index:end_index])
                if not sub_df.empty:
                    dataframes.append(sub_df)
                    
            start_index = end_index + 1
        
        if start_index < len(sheet_df):
            sub_df = process_sub_df(sheet_df.iloc[start_index:])
            if not sub_df.empty:
                dataframes.append(sub_df)
    
    dataframes = [df for df in dataframes if not df.empty]
    for df in dataframes:
        df = df.map(lambda x: x.strip() if isinstance(x, str) else x)
        df = df[df.notnull().sum(axis=1) > 1]
        df = df.replace(r'^\s*$', np.nan, regex=True).dropna(axis=0, how='all').dropna(axis=1, how='all')
        df.reset_index(drop=True, inplace=True)
        
    return dataframes

def process_sub_df(sub_df):
    column_names = sub_df.iloc[0]
    column_names = ['Unnamed' if pd.isna(name) else name for i, name in enumerate(column_names)]
    column_names = make_column_names_unique(column_names)
    column_names = [str(name) for name in column_names]
    sub_df = sub_df[1:]
    sub_df.columns = column_names
    return sub_df

def make_column_names_unique(column_names):
    unique_column_names = []
    seen_names = set()
    for name in column_names:
        if name in seen_names:
            i = 1
            new_name = f"{name}_{i}"
            while new_name in seen_names:
                i += 1
                new_name = f"{name}_{i}"
            unique_column_names.append(new_name)
            seen_names.add(new_name)
        else:
            unique_column_names.append(name)
            seen_names.add(name)
    return unique_column_names
