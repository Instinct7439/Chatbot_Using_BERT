# # import google.generativeai as genai
# # import sys
# # import os

# # # Set up the API key
# # GEMINI_API_KEY = 'AIzaSyAq662hTHDusdpj3-I-sMW4SOL54hDKU5M'

# # # Force API version to v1
# # os.environ["GOOGLE_API_VERSION"] = "v1"

# # genai.configure(api_key=GEMINI_API_KEY)

# # def test_gemini():
# #     try:
# #         print("Testing Gemini API...")
        
# #         # Print version info
# #         print(f"Google Generative AI Version: {genai.__version__}")
# #         print(f"API Version: {os.environ.get('GOOGLE_API_VERSION', 'Not set')}")
        
# #         # Create the model - simplified configuration
# #         model = genai.GenerativeModel(model_name="gemini-pro")
        
# #         # Test a simple prompt
# #         prompt = "What is artificial intelligence? Keep it brief."
# #         print(f"Sending prompt: {prompt}")
        
# #         response = model.generate_content(prompt)
# #         if response and hasattr(response, 'text'):
# #             print(f"Response: {response.text}")
# #         else:
# #             print(f"Response structure: {response}")
        
# #         print("Gemini API test completed successfully")
        
# #     except Exception as e:
# #         print(f"Error testing Gemini API: {str(e)}")
# #         print(f"Error type: {type(e)}")

# # if __name__ == "__main__":
# #     test_gemini() 


# # test_gemini.py

# import google.generativeai as genai
# import pkg_resources

# print("Testing Gemini API...")

# # Show installed library version
# print("Google Generative AI Version:", pkg_resources.get_distribution("google-generativeai").version)

# # Set your API key here
# genai.configure(api_key="AIzaSyAq662hTHDusdpj3-I-sMW4SOL54hDKU5M")

# try:
#     print("Sending prompt: What is artificial intelligence? Keep it brief.")

#     # Load correct Gemini model
#     model = genai.GenerativeModel('gemini-1.5-pro-latest')

#     # Generate content
#     response = model.generate_content("What is artificial intelligence? Keep it brief?")
    
#     print("\n✅ Response:")
#     print(response.text)

# except Exception as e:
#     print("❌ ERROR:", e)
#     print("Error type:", type(e))

# # Initialize Gemini with proper configuration
# try:
#     genai.configure(api_key='AIzaSyAq662hTHDusdpj3-I-sMW4SOL54hDKU5M')
#     # Use the correct model name for the latest Gemini version
#     model = genai.GenerativeModel("gemini-1.5-pro-latest")
    
#     print("Gemini API initialized successfully")
# except Exception as e:
#     print(f"Error initializing Gemini API: {str(e)}")
#     model = None
