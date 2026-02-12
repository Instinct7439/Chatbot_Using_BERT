# DYP Chat - DYPIEMR College Chatbot

An AI-powered chatbot for DYPIEMR college that can answer questions about admissions, courses, facilities, and more.

## Features

- Responsive web interface with modern UI
- AI-powered conversational abilities
- Context-aware responses
- Semantic search for accurate answers
- Answers questions about college admissions, courses, facilities, and more

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Flask
- **ML Models**:
  - Sentence-BERT for semantic search
  - DistilBERT for question answering
  - FAISS for efficient similarity search

## Installation

### Prerequisites

- Python 3.8+ 
- pip (Python package manager)

### Setup

1. Clone this repository:
   ```
   git clone <repository-url>
   cd dyp-chat
   ```

2. Install the required Python packages:
   ```
   pip install -r requirements.txt
   ```

3. Ensure you have the `intents.json` file in the project directory.

## Running the Application

1. Start the Flask server:
   ```
   python Finalized.py
   ```

2. Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```

3. The chatbot interface will load, and you can start asking questions about DYPIEMR college.

## Usage Examples

Here are some example questions you can ask:

- "How can I apply for admission?"
- "What courses do you offer?"
- "What are the hostel facilities?"
- "What are the library timings?"
- "Do you have a placement cell?"

## How It Works

1. The frontend sends user queries to the Flask backend.
2. The backend processes the query using:
   - Semantic search with Sentence-BERT
   - FAISS vector search for finding similar questions
   - Fuzzy matching for handling typos and variations
3. The system selects the best answer based on confidence scores.
4. The chatbot maintains conversation context to handle follow-up questions.

## Customization

To customize the chatbot with additional information:

1. Update the `intents.json` file with new patterns and responses.
2. Add more entries to the FAQ database in `Finalized.py`.

## License

This project is open-source and available under the MIT License.

## Contributors

- [Your Name/Team] 