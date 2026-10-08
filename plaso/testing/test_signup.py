from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import random
import string

def generate_random_email():
    """Generates a random email to ensure we don't get 'User already exists' errors"""
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"testuser_{random_str}@example.com"

def test_plaso_signup():
    # Initialize the Chrome browser
    driver = webdriver.Chrome()
    
    # Navigate to your Expo Web development server
    driver.get("http://localhost:8081")
    driver.maximize_window()

    try:
        # Wait up to 10 seconds for the app to load
        wait = WebDriverWait(driver, 10)
        
        print("1. Clicking 'Sign up' link to go to Register Screen...")
        signup_link = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//*[text()='Sign up']")
        ))
        signup_link.click()
        
        # We need a brief pause for the React Navigation transition
        time.sleep(1)

        print("2. Entering Full Name...")
        name_input = wait.until(EC.presence_of_element_located(
            (By.XPATH, "//input[@placeholder='Enter your full name']")
        ))
        name_input.clear()
        name_input.send_keys("Automated Test User")

        print("3. Entering Email...")
        email_input = driver.find_element(
            By.XPATH, "//input[@placeholder='Enter your email']"
        )
        email_input.clear()
        email_input.send_keys(generate_random_email())
        
        print("4. Entering Password...")
        password_input = driver.find_element(
            By.XPATH, "//input[@placeholder='Create a password']"
        )
        password_input.clear()
        # Password must have uppercase, lowercase, number, and 8+ chars
        password_input.send_keys("TestPass123!") 
        
        print("5. Confirming Password...")
        confirm_password_input = driver.find_element(
            By.XPATH, "//input[@placeholder='Repeat your password']"
        )
        confirm_password_input.clear()
        confirm_password_input.send_keys("TestPass123!")
        
        print("6. Clicking Create Account...")
        register_button = driver.find_element(
            By.XPATH, "//*[text()='Create Account with Email']"
        )
        register_button.click()
        
        # 7. Wait for the API response and Home Screen transition
        time.sleep(3) 
        
        print("✅ Registration test executed successfully!")

    except Exception as e:
        print(f"❌ Test Failed: {e}")
        
    finally:
        # Close the browser after the test
        driver.quit()

if __name__ == "__main__":
    test_plaso_signup()
