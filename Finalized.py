from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from transformers import AutoModelForQuestionAnswering, AutoTokenizer, pipeline
import faiss
import numpy as np
import json
import random
import os
import shutil
from rapidfuzz import process, fuzz  # For fuzzy matching
import google.generativeai as genai
from config import *
import re

# Get the directory where the script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(SCRIPT_DIR, 'static')

app = Flask(__name__, 
    static_url_path='',
    static_folder=STATIC_DIR)
CORS(app)  # Enable CORS for all routes

print("Loading models and creating embeddings...")

# Load DistilBERT model and tokenizer for Question Answering
model_name = "distilbert-base-uncased-distilled-squad"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForQuestionAnswering.from_pretrained(model_name)
qa_pipeline = pipeline("question-answering", model=model, tokenizer=tokenizer)

# Load Sentence-BERT for semantic search
sbert_model = SentenceTransformer('all-MiniLM-L6-v2')

# Load intents.json dataset
with open(os.path.join(SCRIPT_DIR, "intents.json"), "r", encoding="utf-8") as file:
    data = json.load(file)

# Load faculty_data.json
with open(os.path.join(SCRIPT_DIR, "faculty_data.json"), "r", encoding="utf-8") as file:
    faculty_data = json.load(file)

# Extract questions, answers, and tags from intents dataset
questions = []
answers = []
tags = []

for intent in data["intents"]:
    for pattern in intent["patterns"]:
        questions.append(pattern)
        answers.append(intent["responses"])  # List of possible responses
        tags.append(intent["tag"])

# Convert questions into embeddings
question_embeddings = sbert_model.encode(questions)

# Create FAISS index for intents dataset
dimension = question_embeddings.shape[1]
index_intents = faiss.IndexFlatL2(dimension)
index_intents.add(question_embeddings)

# Expanded FAQ database
faqs = [
    ("How can I apply for admission?", "You can apply online through our admission portal."),
    ("What are the admission requirements?", "Admission requires previous academic records and ID proof."),
    ("How much is the tuition fee?", "The tuition fee depends on the course. Check the fee structure on our website."),
    ("What courses do you offer?", "We offer undergraduate and postgraduate programs in Science, Commerce, and Arts."),
    ("How can I get a scholarship?", "Scholarships are awarded based on merit. Visit the scholarship section on our website."),
    ("Do you offer hostel facilities?", "Yes, we provide hostel facilities for both boys and girls."),
    ("What is the last date to apply for admission?", "The admission deadline is mentioned on the official website."),
    ("Do you have a placement cell?", "Yes, our placement cell provides internship and job opportunities."),
    ("Is there an entrance exam?", "Some courses require an entrance exam, while others are based on merit."),
    ("What are the library timings?", "The library is open from 8 AM to 6 PM."),
    ("What are the college timings?", "College is open from 8 AM to 5 PM, Monday to Saturday."),
    ("What are the hostel facilities?", "We provide separate hostel facilities for boys and girls."),
    ("What are the hostel timings?", "Hostel is open from 6 AM to 10 PM."),
    ("What about hostel fees?", "Hostel fees vary based on room type. Check the official website."),
    
    ("What departments are available in DYPIEMR?", "DYPIEMR offers departments including Computer Engineering, Electronics & Telecommunication Engineering, Mechanical Engineering, Civil Engineering, Chemical Engineering, and Artificial Intelligence & Data Science."),
    ("Where is DYPIEMR located?", "DYPIEMR is located at D. Y. Patil Educational Complex, Sector 29, Nigdi Pradhikaran, Akurdi, Pune 411044, Maharashtra, India."),
    ("What is the mission of DYPIEMR?", "The mission of DYPIEMR is to train, educate and transform the youth into Architects of global excellence imbibing India's spiritual, intellectual and cultural ethos."),
    ("What is the vision of DYPIEMR?", "The vision of DYPIEMR is 'Empowerment through Knowledge'."),
    ("Does DYPIEMR provide placement assistance?", "Yes, DYPIEMR has an excellent placement record with many top companies visiting the campus for recruitment drives."),
]

# Separate FAQ questions and answers
faq_questions = [q[0] for q in faqs]
faq_answers = [q[1] for q in faqs]
faq_embeddings = sbert_model.encode(faq_questions)

# Create FAISS index for FAQ dataset
dimension = faq_embeddings.shape[1]
index_faq = faiss.IndexFlatL2(dimension)
index_faq.add(faq_embeddings)

# Chat history to maintain conversational flow
chat_history = {}

# Initialize Gemini with proper configuration
try:
    genai.configure(api_key='AIzaSyAq662hTHDusdpj3-I-sMW4SOL54hDKU5M')
    # Use the correct model name for the latest Gemini version
    model = genai.GenerativeModel("gemini-1.5-pro-latest")
    
    print("Gemini API initialized successfully")
except Exception as e:
    print(f"Error initializing Gemini API: {str(e)}")
    model = None

def get_last_question(user_id):
    """ Retrieve the last meaningful user question. """
    if user_id in chat_history and len(chat_history[user_id]) > 1:
        for entry in reversed(chat_history[user_id]):
            if "user" in entry:
                return entry["user"]
    return None

# Function to get faculty response
def get_faculty_response(query):
    query = query.lower()
    
    # Check if query is about faculty
    faculty_keywords = ['faculty', 'professor', 'teacher', 'hod', 'head', 'department']
    if not any(keyword in query for keyword in faculty_keywords):
        return None
    
    try:
        # Load faculty data each time to ensure we have the latest data
        with open("faculty_data.json", "r", encoding="utf-8") as file:
            faculty_data = json.load(file)
        
        # Search through departments
        response = ""
        found_specific_department = False
        
        for department in faculty_data['Departments']:
            dept_name = department['Name'].lower()
            
            # If query mentions department name or it's a general faculty query
            if dept_name in query or 'faculty' in query:
                # Return department faculty list
                if 'hod' in query or 'head' in query:
                    # Return HOD information
                    for faculty in department['Faculty']:
                        if any(title in faculty['Designation'].lower() for title in ['hod', 'head']):
                            return f"The HOD of {department['Name']} is {faculty['Name']} ({faculty['Designation']})."
                
                # If it's a specific department query
                if dept_name in query:
                    found_specific_department = True
                    response = f"""
                    <div class='department-container'>
                        <h2 class='department-title'>{department['Name']}</h2>
                        <table class='faculty-table'>
                            <tr>
                                <th>NAME</th>
                                <th>DESIGNATION</th>
                                <th>QUALIFICATION</th>
                                <th>SPECIALIZATION</th>
                                <th>EXPERIENCE</th>
                            </tr>
                    """
                    
                    for faculty in department['Faculty']:
                        response += f"""
                            <tr>
                                <td>{faculty['Name']}</td>
                                <td>{faculty['Designation']}</td>
                                <td>{faculty.get('Qualification', 'N/A')}</td>
                                <td>{faculty.get('Specialization', 'N/A')}</td>
                                <td>{faculty.get('Experience', 'N/A')}</td>
                            </tr>
                        """
                    
                    response += "</table></div>"
                    return response
        
        # If it's a general faculty query and no specific department was found
        if 'faculty' in query and not found_specific_department:
            response = "<div class='all-departments'>"
            for department in faculty_data['Departments']:
                response += f"""
                    <div class='department-container'>
                        <h2 class='department-title'>{department['Name']}</h2>
                        <table class='faculty-table'>
                            <tr>
                                <th>NAME</th>
                                <th>DESIGNATION</th>
                                <th>QUALIFICATION</th>
                                <th>SPECIALIZATION</th>
                                <th>EXPERIENCE</th>
                            </tr>
                """
                
                for faculty in department['Faculty']:
                    response += f"""
                        <tr>
                            <td>{faculty['Name']}</td>
                            <td>{faculty['Designation']}</td>
                            <td>{faculty.get('Qualification', 'N/A')}</td>
                            <td>{faculty.get('Specialization', 'N/A')}</td>
                            <td>{faculty.get('Experience', 'N/A')}</td>
                        </tr>
                    """
                
                response += "</table></div>"
            response += "</div>"
            return response
        
    except Exception as e:
        print(f"Error loading faculty data: {str(e)}")
        return "Sorry, I'm having trouble accessing the faculty information right now."
    
    return None

def categorize_query(query):
    """Categorize the query to determine the appropriate system instruction."""
    query_lower = query.lower()
    
    # Define category keywords
    categories = {
        "programming": ["programming", "coding", "developer", "software", "web development", 
                       "app development", "python", "java", "javascript", "code", "algorithm",
                       "programming language", "compiler", "debugging", "frontend", "backend",
                       "fullstack", "mobile app", "website", "development environment"],
        
        "career": ["career", "job", "intern", "internship", "placement", "salary", "interview", 
                  "resume", "cv", "opportunity", "industry", "profession", "employment",
                  "campus placement", "recruitment", "job profile", "career path", "job market",
                  "company", "corporate", "package", "offer letter", "training and placement"],
        
        "ai_ml": ["ai", "artificial intelligence", "machine learning", "deep learning", "neural network", 
                 "data science", "nlp", "computer vision", "ml", "analytics", "big data",
                 "tensorflow", "pytorch", "data mining", "predictive modeling", "classification",
                 "clustering", "regression", "reinforcement learning", "supervised learning"],
        
        "academic": ["study", "course", "subject", "exam", "assignment", "project", "grade", 
                    "semester", "lecture", "thesis", "dissertation", "academic", "syllabus",
                    "curriculum", "credit", "cgpa", "sgpa", "practical", "theory", "laboratory",
                    "classroom", "tutorial", "course material", "textbook", "reference book"],
        
        "technical": ["engineering", "technical", "technology", "hardware", "software", "system", 
                     "network", "database", "cloud", "security", "cybersecurity", "mechanical",
                     "civil", "chemical", "electronics", "electrical", "telecommunication",
                     "circuits", "design", "robotics", "iot", "embedded systems", "control systems"],
        
        "infrastructure": ["campus", "facility", "lab", "laboratory", "library", "hostel", 
                          "canteen", "cafeteria", "classroom", "auditorium", "sports", "wifi",
                          "internet", "parking", "gym", "ground", "building", "seminar hall",
                          "workshop", "computer center", "amenities", "infrastructure"],
        
        "admission": ["admission", "apply", "entrance", "eligibility", "fee", "scholarship", 
                     "financial aid", "application", "document", "certificate", "deadline",
                     "cutoff", "merit", "counseling", "registration", "seat", "quota",
                     "category", "verification", "entrance exam", "jee", "mht-cet"],
        
        "extracurricular": ["club", "event", "festival", "cultural", "sports", "competition", 
                           "activity", "association", "committee", "council", "team", "society",
                           "tournament", "performance", "workshop", "hackathon", "techfest",
                           "innovision", "celebration", "nss", "social service"]
    }
    
    # Check which category has the most keyword matches
    max_matches = 0
    best_category = "general"
    
    for category, keywords in categories.items():
        matches = sum(1 for keyword in keywords if keyword in query_lower)
        if matches > max_matches:
            max_matches = matches
            best_category = category
    
    return best_category if max_matches > 0 else "general"

def get_system_instruction(query_type):
    """Get the appropriate system instruction based on query type."""
    instructions = {
        "programming": """You are a programming mentor for DY Patil Institute of Engineering, Management & Research (DYPIEMR).
            Provide clear, practical coding advice with brief examples related to coursework at DYPIEMR.
            Focus on helping students understand concepts taught in our Computer Engineering and AI & Data Science programs.
            Mention DYPIEMR-specific resources like our Programming Club, coding competitions, and technical events held at campus.
            Suggest practical projects aligned with DYPIEMR's curriculum and industry requirements.
            Keep responses concise (3-5 sentences max) and student-friendly.""",
        
        "career": """You are a career counselor for DY Patil Institute of Engineering, Management & Research (DYPIEMR).
            Provide guidance on engineering career paths relevant to DYPIEMR's six engineering departments.
            Highlight skills that are in demand for DYPIEMR graduates, based on our placement records.
            Mention specific companies that recruit from DYPIEMR and internship opportunities available through our T&P cell.
            Include information about DYPIEMR's placement preparation activities, mock interviews, and resume workshops.
            Keep advice practical and actionable for DYPIEMR engineering students.""",
        
        "ai_ml": """You are an AI/ML specialist at DY Patil Institute of Engineering, Management & Research (DYPIEMR).
            Explain artificial intelligence and machine learning concepts as taught in our AI & Data Science Department.
            Relate concepts to labs and practical sessions conducted in DYPIEMR's AI research center.
            Recommend beginner-friendly projects aligned with DYPIEMR's AI & Data Science curriculum.
            Mention AI/ML competitions, workshops and events hosted by DYPIEMR.
            Keep explanations concise and accessible to DYPIEMR undergraduate students.""",
        
        "academic": """You are an academic advisor at DY Patil Institute of Engineering, Management & Research (DYPIEMR).
            Provide guidance on study strategies, course selection, and academic planning for DYPIEMR students.
            Focus on DYPIEMR's engineering curriculum, credit system, and educational practices.
            Suggest DYPIEMR resources like our central library, digital learning platforms, and departmental libraries.
            Mention academic support services available at DYPIEMR including mentoring programs and remedial classes.
            Keep advice practical and tailored to DYPIEMR's academic calendar and evaluation system.""",
        
        "technical": """You are a technical specialist at DY Patil Institute of Engineering, Management & Research (DYPIEMR).
            Explain engineering concepts as taught in DYPIEMR's various engineering departments.
            Provide insights on lab facilities, equipment, and software available at DYPIEMR.
            Suggest hands-on projects that can be implemented using DYPIEMR's technical infrastructure.
            Mention technical clubs, competitions, and workshops conducted at DYPIEMR.
            Keep explanations concise and focused on building real-world skills relevant to DYPIEMR's curriculum.""",
        
        "infrastructure": """You are an infrastructure guide for DY Patil Institute of Engineering, Management & Research (DYPIEMR).
            Provide information about DYPIEMR's campus facilities including labs, library, canteen, and sports facilities.
            Describe DYPIEMR's hostel accommodations at DY Patil Residency with its modern amenities.
            Mention DYPIEMR's transportation facilities, Wi-Fi coverage, and digital infrastructure.
            Give details about DYPIEMR's auditorium, seminar halls, and event spaces.
            Keep descriptions concise and accurate based on current DYPIEMR infrastructure.""",
        
        "admission": """You are an admissions counselor for DY Patil Institute of Engineering, Management & Research (DYPIEMR).
            Provide guidance on DYPIEMR's admission process, eligibility criteria, and application deadlines.
            Explain DYPIEMR's intake capacity, reservation policies, and fee structure.
            Mention required documents, entrance exams (JEE, MHT-CET), and counseling procedures for DYPIEMR.
            Include information about scholarships and financial aid available at DYPIEMR.
            Keep guidance straightforward and up-to-date with DYPIEMR's current admission policies.""",
        
        "extracurricular": """You are a student activities coordinator at DY Patil Institute of Engineering, Management & Research (DYPIEMR).
            Provide information about student clubs, cultural events, and sports activities at DYPIEMR.
            Describe annual events like INNOVISION (technical festival) and cultural festivals held at DYPIEMR.
            Mention leadership opportunities through DYPIEMR's student council and departmental associations.
            Include details about NSS, sports competitions, and cultural performances at DYPIEMR.
            Keep information engaging and relevant to DYPIEMR's vibrant campus life.""",
        
        "general": """You are a helpful assistant for DY Patil Institute of Engineering, Management & Research (DYPIEMR) students.
            Provide concise, accurate information about DYPIEMR's education, engineering programs, and campus life.
            Highlight DYPIEMR's NAAC accreditation, industry connections, and achievements.
            Mention DYPIEMR's location in Akurdi, Pune and its affiliation with Savitribai Phule Pune University.
            Keep responses short (3-4 sentences) and focused on the question.
            Always maintain a helpful, professional tone representing DYPIEMR values."""
    }
    
    return instructions.get(query_type, instructions["general"])

def clean_gemini_response(response_text):
    """Clean up Gemini responses to remove markdown formatting."""
    if not response_text:
        return response_text
        
    # Remove markdown bold/italic formatting (** and *)
    cleaned = response_text.replace('**', '')
    cleaned = cleaned.replace('*', '')
    
    # Remove markdown headings (# symbols)
    cleaned = re.sub(r'#{1,6}\s+', '', cleaned)
    
    # Remove markdown list indicators
    cleaned = re.sub(r'^\s*[-*+]\s+', '', cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r'^\s*\d+\.\s+', '', cleaned, flags=re.MULTILINE)
    
    # Remove code blocks and inline code
    cleaned = re.sub(r'```[\s\S]*?```', '', cleaned)
    cleaned = cleaned.replace('`', '')
    
    # Fix extra newlines and spacing
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    cleaned = cleaned.strip()
    
    # Convert markdown links to HTML links
    cleaned = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2" target="_blank">\1</a>', cleaned)
    
    # Optional: Convert simple newlines to HTML line breaks
    cleaned = cleaned.replace('\n', '<br>')
    
    return cleaned

def get_gemini_response(query):
    try:
        if not model:
            print("Gemini model not initialized")
            return None
        
        # Categorize the query
        query_type = categorize_query(query)
        print(f"Query type detected: {query_type}")
        
        # Get appropriate system instruction
        system_instruction = get_system_instruction(query_type)
        
        # Combine instruction and query
        prompt = f"{system_instruction}\n\nUser question: {query}"
        
        try:
            # Generate response using the model with specialized instruction
            response = model.generate_content(prompt)
            if response and hasattr(response, 'text'):
                print(f"Gemini response received for '{query}' using {query_type} instruction")
                
                # Clean the response before returning
                cleaned_response = clean_gemini_response(response.text)
                
                # Add a wrapper div with a special class to indicate this is a Gemini response
                wrapped_response = f'<div class="gemini-response">{cleaned_response}</div>'
                return wrapped_response
                
            return None
        except Exception as e:
            print(f"Error in Gemini API call: {str(e)}")
            return None
    except Exception as e:
        print(f"Error in get_gemini_response: {str(e)}")
        return None

def is_technical_query(query):
    """Check if the query should be directly handled by Gemini."""
    query_lower = query.lower()
    
    # Only use Gemini directly for truly technical queries
    # that our existing system likely can't answer well
    direct_categories = [
        "programming", "ai_ml"  # Only keep the most technical categories
    ]
    
    # Get the category of the query
    category = categorize_query(query_lower)
    
    # Use Gemini directly only for these limited categories
    if category in direct_categories:
        return True
        
    # Also check for specific technical keywords as a backup
    technical_keywords = [
        'programming language', 'coding', 'algorithm', 
        'machine learning', 'artificial intelligence', 'neural network'
    ]
    
    # Be more strict about keyword matching
    # Require at least two words to match or a specific phrase
    matches = sum(1 for keyword in technical_keywords if keyword in query_lower)
    return matches >= 2 or any(phrase in query_lower for phrase in ['how to code', 'how to program'])

def get_answer(user_id, query, last_topic=None):
    print(f"Processing query: {query}")  # Debug logging

    # First check if it's a faculty query
    faculty_response = get_faculty_response(query)
    if faculty_response:
        return faculty_response

    # Check if it's a technical query that should go directly to Gemini
    if is_technical_query(query):
        print("Technical query detected, routing to specialized Gemini response")
        gemini_response = get_gemini_response(query)
        if gemini_response:
            print(f"Specialized response: {gemini_response[:100]}...")
            return gemini_response
        print("Gemini failed to respond, falling back to default system")

    # If question is vague, check last topic
    if query in ["what about its fees?", "when is it open?", "how can I apply?", "what are its timings?"]:
        if last_topic:
            # Adjust query to reflect correct category
            if "hostel" in last_topic:
                query = "hostel " + query
            elif "library" in last_topic:
                query = "library " + query
            elif "admission" in last_topic:
                query = "admission " + query
            else:
                return "Can you specify what you're asking about?"
        else:
            return "Can you specify what you're asking about?"

    # Proceed with normal response fetching
    query_embedding = sbert_model.encode([query])

    # 🔹 1️⃣ FAISS search for intents
    dist_intents, index_result_intents = index_intents.search(query_embedding, 1)
    best_match_intents = index_result_intents[0][0]
    intent_score = dist_intents[0][0]

    # 🔹 2️⃣ FAISS search for FAQs
    dist_faq, index_result_faq = index_faq.search(query_embedding, 1)
    best_match_faq = index_result_faq[0][0]
    faq_score = dist_faq[0][0]

    # 🔹 3️⃣ Fuzzy Matching
    fuzzy_match, fuzzy_score, _ = process.extractOne(query, questions + faq_questions, scorer=fuzz.ratio)

    # Define thresholds
    FAISS_THRESHOLD = 8.0
    FUZZY_THRESHOLD = 85

    response = None
    confidence = 0

    if intent_score < faq_score and intent_score < FAISS_THRESHOLD:
        response = random.choice(answers[best_match_intents])
        confidence = 95
    elif faq_score < intent_score and faq_score < FAISS_THRESHOLD:
        response = faq_answers[best_match_faq]
        confidence = 95
    elif fuzzy_score > FUZZY_THRESHOLD:
        if fuzzy_match in questions:
            response = random.choice(answers[questions.index(fuzzy_match)])
        else:
            response = faq_answers[faq_questions.index(fuzzy_match)]
        confidence = 85

    # If no good response found, try categorized Gemini as a last resort
    if not response or confidence < 75:
        print("Low confidence response, trying categorized Gemini response")
        category = categorize_query(query)
        print(f"Using {category} instruction for fallback response")
        gemini_response = get_gemini_response(query)
        if gemini_response:
            response = gemini_response
            confidence = 80
        else:
            response = f"I'm not sure about that. Could you ask something related to DYPIEMR's admissions, courses, facilities, campus, or faculty?"
            confidence = 50

    print(f"Final response type: {type(response)}")
    print(f"Final response preview: {str(response)[:100]}... (Confidence: {confidence}%)")
    return response

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route("/chat", methods=["POST"])
def chatbot():
    data = request.get_json()
    user_id = data.get("user_id", "default")
    query = data.get("query", "").strip().lower()

    if not query:
        return jsonify({"response": "Please enter a valid query.", "chat_history": chat_history.get(user_id, [])})

    last_topic = get_last_question(user_id)
    response = get_answer(user_id, query, last_topic)

    chat_history.setdefault(user_id, []).append({"user": query})
    chat_history[user_id].append({"bot": response})

    return jsonify({"response": response, "chat_history": chat_history[user_id]})

if __name__ == "__main__":
    print("Starting the DYP Chat application...")
    print("Models and embeddings loaded successfully!")
    print("Server is running at http://127.0.0.1:5000/")
    app.run(debug=True)





