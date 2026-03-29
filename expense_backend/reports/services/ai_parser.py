import json
import re
import os 
from dotenv import load_dotenv
from datetime import date, timedelta
from google import genai

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def _clean_markdown(raw: str) -> str:
    """Strip ```json ... ``` or ``` ... ``` fences Gemini sometimes wraps around JSON."""
    raw = raw.strip()
    # match ```json or ``` at start
    if raw.startswith("```"):
        # remove opening fence + optional language tag
        raw = re.sub(r"^```[a-zA-Z]*\n?", "", raw)
        # remove closing fence
        raw = re.sub(r"\n?```$", "", raw)
    return raw.strip()


def _parse_amount(value) -> float:
    """
    Coerce amount to float.
    Handles: 10000, "10000", "10k", "10K", "1.5k", "1 lakh", "1L" etc.
    """
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip().lower().replace(",", "")
    # lakh variants: "1 lakh", "1l", "1.5l"
    lakh = re.match(r"^([\d.]+)\s*(?:lakh|l)$", s)
    if lakh:
        return float(lakh.group(1)) * 100_000
    # k variants: "10k", "1.5k"
    k = re.match(r"^([\d.]+)\s*k$", s)
    if k:
        return float(k.group(1)) * 1_000
    # plain number
    try:
        return float(s)
    except ValueError:
        return 0.0


def parse_natural_expense(text: str) -> dict:
    today = date.today()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)
    day_before = today - timedelta(days=2)
    day_after = today + timedelta(days=2)

    prompt = f"""
You are a precise expense data extractor. Extract structured data from the sentence below.

Sentence: "{text}"

Return ONLY a raw JSON object — no markdown, no code fences, no explanation.
Format:
{{
  "title": "short clean title",
  "amount": <number only, no currency symbols or words like k/lakh>,
  "category": "<one of: FOOD, SHOPPING, TRANSPORT, ENTERTAINMENT, HEALTH, BILLS, TRAVEL, OTHER>",
  "date": "YYYY-MM-DD"
}}

Rules:
- Amount: convert shorthand → "10k" = 10000, "1.5k" = 1500, "1 lakh" = 100000. Return as plain number.
- Date: resolve relative dates using today's date.
  - "today" = {today}
  - "yesterday" = {yesterday}
  - "tomorrow" = {tomorrow}
  - "day before yesterday" = {day_before}
  - "day after tomorrow" = {day_after}
  - "last monday" etc → calculate the actual date
  - If no date mentioned → use {today}
- Category: pick the best match. Shoes/clothes → SHOPPING. Food/restaurant → FOOD.
- Title: clean and short, e.g. "Nike shoes" not "bought nike shoes for 10k day before yesterday"
- Return ONLY the JSON. No extra text, no markdown fences.
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        raw = _clean_markdown(response.text)
        data = json.loads(raw)

        # coerce amount in case Gemini still returned "10k" as a string
        data["amount"] = _parse_amount(data.get("amount", 0))

        # validate category
        VALID_CATEGORIES = ["FOOD", "SHOPPING", "TRANSPORT", "ENTERTAINMENT", "HEALTH", "BILLS", "TRAVEL", "OTHER"]
        if data.get("category", "").upper() not in VALID_CATEGORIES:
            data["category"] = "OTHER"
        else:
            data["category"] = data["category"].upper()

        # validate date format — fallback to today if malformed
        try:
            date.fromisoformat(data.get("date", ""))
        except (ValueError, TypeError):
            data["date"] = str(today)

        return data

    except json.JSONDecodeError as e:
        return {"error": f"could not parse AI response as JSON: {e}"}
    except Exception as e:
        return {"error": str(e)}