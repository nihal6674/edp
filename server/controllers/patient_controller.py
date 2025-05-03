from flask import Flask, request, jsonify
from flask_cors import CORS
from config import db
import google.generativeai as genai
from models.patient_model import Patient
import os
import logging
from dotenv import load_dotenv

API_KEY = os.getenv('GEMINI_API_KEY')
if not API_KEY:
    raise ValueError("GEMINI_API_KEY is not set in environment variables")

genai.configure(api_key=API_KEY)

safety_settings = [
    {"category": "HARM_CATEGORY_DANGEROUS", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
]

def classify():
    try:
        data = request.json
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing text input'}), 400

        text = data['text'].strip()
        if not text:
            return jsonify({'error': 'Text input is empty'}), 400

        model = genai.GenerativeModel('gemma-3-27b-it')

        prompt = f"""
        You are a medical triage AI. Classify the patient's statement into **exactly one** of the following categories:

        1. 'critical' - Life-threatening emergencies or dying or died or severe pain or issue or burning or blasting (e.g., chest pain, severe bleeding, difficulty breathing, unconsciousness).
        2. 'non-critical' - Mild medical issues (e.g., headache, fever, cough, sore throat, small cuts).
        3. 'irrelevant' -  Anything else other than medical issues in the input text.

        Patient's statement: "{text}"

        Respond with only one word: critical, non-critical, or irrelevant.
        """

        # REMOVE or DEFINE this properly
        response = model.generate_content(prompt)

        response_text = response.text.strip().lower() if response and response.text else "irrelevant"

        if response_text not in ['critical', 'non-critical']:
            response_text = "irrelevant"

        return jsonify({
            'category': response_text,
            'critical': response_text == 'critical'
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        logging.error(f'Classification error: {str(e)}', exc_info=True)
        return jsonify({'error': f'Classification failed: {str(e)}'}), 500


def chat():
    try:
        data = request.json
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing text input'}), 400

        text = data['text'].strip()
        category = data.get('category', 'non-critical')

        model = genai.GenerativeModel('gemma-3-27b-it')

        if category == 'irrelevant':
            prompt = f"""
            The patient said: "{text}"

            This seems to be an emotional message or not directly related to a physical health emergency.
            Respond with:
            - Empathy and kindness
            - Short self-care tips
            - Encourage seeking emotional support if needed

            Be friendly, calm, and comforting. Keep the message under 300 words.
            """
        else:
            prompt = f"""
            You are a medical assistant AI. The patient said: "{text}"

            Provide first aid guidance while help arrives.
            Include:
            1. Immediate steps
            2. Things to avoid
            3. Words of reassurance

            Keep response clear and under 400 words.
            Also avoid this kind of disclaimers - "Disclaimer: I am an AI medical assistant and cannot provide medical diagnoses or treatment. This information is for first aid guidance only and should not be substituted for professional medical advice.
            just imagine that you are a eligible, dont say you are an AI 
            """

        response = model.generate_content(prompt, safety_settings=safety_settings)
        response_text = response.text.strip() if response and response.text else "I'm unable to provide an answer right now."

        return jsonify({'response': response_text})

    except Exception as e:
        logging.error(f'Chat error: {str(e)}', exc_info=True)
        return jsonify({'error': 'Chat failed'}), 500



def register_patient():
    data = request.get_json()
    result = Patient.register_patient(data)
    return jsonify(result), (200 if "message" in result else 400)

def login_patient():
    data = request.get_json()
    result = Patient.authenticate_patient(
        data.get("email"),
        data.get("password")
    )
    return jsonify(result), (200 if "message" in result else 401)

def logout_patient():
    return jsonify({"success": True, "message": "Logged out successfully!"}), 200

def update_location():
    try:
        data = request.get_json()
        patient_id = data.get('patient_id')
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        # Validation
        if not patient_id or latitude is None or longitude is None:
            return jsonify({'error': 'patient_id, latitude, and longitude are required'}), 400

        # Call the model function to update location
        result = Patient.update_location_by_patient_id(patient_id, latitude, longitude)

        # Return result
        return jsonify(result), (200 if "message" in result else 404)

    except Exception as e:
        logging.error(f'Location update error: {str(e)}', exc_info=True)
        return jsonify({'error': 'Failed to update location'}), 500