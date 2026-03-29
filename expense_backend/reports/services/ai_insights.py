import google.genai as genai
import os 
from dotenv import load_dotenv 
load_dotenv()
client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
model = 'gemini-2.5-flash'


def generate_ai_insights(raw_insights):
    prompt = f""" 
    You are a smart financial assistant.

    Convert the following financial insights into friendly, human-like advice.
    Keep it short and actionable.

    Insights:
    {raw_insights}

    Output:
    """
    try:
        response = client.models.generate_content(model=model,contents=prompt)
        return response.text
    except Exception as e: 
        return 'Unable to generate AI advice at the moment.'
    
    
def suggest_ai_category(title:str) -> str: 
    prompt = f"""
    Classify this expense into one of 
    [FOOD, SHOPPING, TRANSPORT, ENTERTAINMENT, HEALTH, BILLS, TRAVEL, OTHER]: 
    Expense: '{title}'
    Reply only with just the category word. Nothing else. Please make the correct choice and rethink before putting in others"""
    try:
        response = client.models.generate_content(model=model, contents=prompt)
        category = response.text.strip().upper()
        VALID = ["FOOD", "SHOPPING", "TRANSPORT", "ENTERTAINMENT", "HEALTH", "BILLS", "TRAVEL", "OTHER"]
        if category in VALID: 
            return category
    except Exception as e:
        print('AI error: ', e)
        return 'OTHER'
    
    
    
def explain_anomalies(anomalies):
    if not anomalies:
        return ["No unusual spending patterns detected."]

    prompt = f"""
    You are a financial assistant.

    Explain the following spending anomalies in a simple, friendly way.

    Data:
    {anomalies}

    Instructions:
    - Be concise
    - Mention percentage increase
    - Mention actual spending examples
    - Give 1 actionable suggestion
    """

    try:
        response = client.models.generate_content(model=model, contents=prompt)
        return response.text.strip()

    except Exception as e:
        print("AI Error:", e)
        return "Unable to generate insights right now."